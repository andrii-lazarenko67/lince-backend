'use strict';

const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO
};

const ADDON_PRICE_IDS = {
  user: process.env.STRIPE_PRICE_ADDON_USER,
  storage_10: process.env.STRIPE_PRICE_ADDON_STORAGE_10,
  storage_25: process.env.STRIPE_PRICE_ADDON_STORAGE_25,
  storage_50: process.env.STRIPE_PRICE_ADDON_STORAGE_50
};

const ADDON_NAMES = {
  user: 'Usuário Adicional',
  storage_10: '+10 GB Armazenamento',
  storage_25: '+25 GB Armazenamento',
  storage_50: '+50 GB Armazenamento'
};

const PLAN_NAMES = {
  starter: 'Iniciante',
  pro: 'Profissional',
  enterprise: 'Empresarial Personalizado',
  none: 'Sem Plano'
};

/**
 * Derive plan name from Stripe price ID
 */
function planFromPriceId(priceId) {
  if (!priceId) return 'none';
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  return 'none';
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus) {
  const map = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
    paused: 'past_due'
  };
  return map[stripeStatus] || 'expired';
}

const stripeService = {
  /**
   * Create or retrieve a Stripe customer for a client
   */
  async getOrCreateCustomer(client, ownerEmail, ownerName) {
    if (client.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(client.stripeCustomerId);
        if (!customer.deleted) return customer;
      } catch {
        // Customer not found in Stripe, create a new one
      }
    }

    const customer = await stripe.customers.create({
      email: client.email || ownerEmail,
      name: client.name,
      metadata: {
        clientId: String(client.id),
        ownerName
      }
    });

    await client.update({ stripeCustomerId: customer.id });
    return customer;
  },

  /**
   * Create a Stripe checkout session for a given plan
   */
  async createCheckoutSession({ client, plan, ownerEmail, ownerName, successUrl, cancelUrl }) {
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId || !priceId.startsWith('price_')) {
      const err = new Error(`Stripe price ID not configured for plan: ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} in .env`);
      err.statusCode = 503;
      err.messageKey = 'billing.errors.stripeNotConfigured';
      throw err;
    }

    const customer = await this.getOrCreateCustomer(client, ownerEmail, ownerName);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        clientId: String(client.id),
        plan
      },
      subscription_data: {
        metadata: {
          clientId: String(client.id),
          plan
        }
      },
      allow_promotion_codes: true,
      locale: 'pt-BR'
    });

    return session;
  },

  /**
   * Create a Stripe billing portal session so user can manage their subscription
   */
  async createPortalSession({ stripeCustomerId, returnUrl }) {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl
    });
    return session;
  },

  /**
   * Retrieve a checkout session (used on success redirect to verify payment)
   */
  async getCheckoutSession(sessionId) {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price']
    });
  },

  /**
   * Retrieve a subscription from Stripe
   */
  async getSubscription(subscriptionId) {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });
  },

  /**
   * Cancel a subscription immediately
   */
  async cancelSubscription(subscriptionId) {
    return await stripe.subscriptions.cancel(subscriptionId);
  },
  /**
   * Change the plan of an active subscription (upgrade or downgrade).
   */
  async changeSubscriptionPlan(subscriptionId, newPlan) {
    const priceId = PLAN_PRICE_IDS[newPlan];
    if (!priceId || !priceId.startsWith('price_')) {
      const err = new Error(`Stripe price ID not configured for plan: ${newPlan}`);
      err.statusCode = 503;
      err.messageKey = 'billing.errors.stripeNotConfigured';
      throw err;
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });
    const existingItemId = subscription.items.data[0]?.id;
    if (!existingItemId) throw new Error('No subscription item found');
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: existingItemId, price: priceId }],
      proration_behavior: 'always_invoice',
      metadata: { plan: newPlan }
    });
    return updated;
  },

  /**
   * List invoices for a Stripe customer
   */
  async listInvoices(stripeCustomerId, limit = 20) {
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit,
      expand: ['data.payment_intent']
    });
    return invoices.data;
  },

  /**
   * Construct and verify a Stripe webhook event
   */
  constructWebhookEvent(payload, signature) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  },

  /**
   * Create a Stripe checkout session for an add-on purchase
   */
  async createAddonCheckoutSession({ client, addonType, quantity = 1, ownerEmail, ownerName, successUrl, cancelUrl }) {
    const priceId = ADDON_PRICE_IDS[addonType];
    if (!priceId || !priceId.startsWith('price_')) {
      const err = new Error('Stripe price ID not configured for addon: ' + addonType);
      err.statusCode = 503;
      err.messageKey = 'billing.errors.stripeNotConfigured';
      throw err;
    }

    const customer = await this.getOrCreateCustomer(client, ownerEmail, ownerName);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}&addon=' + addonType,
      cancel_url: cancelUrl,
      metadata: {
        clientId: String(client.id),
        addonType,
        quantity: String(quantity)
      },
      subscription_data: {
        metadata: {
          clientId: String(client.id),
          addonType,
          quantity: String(quantity)
        }
      },
      locale: 'pt-BR'
    });

    return session;
  },

  PLAN_NAMES,
  ADDON_NAMES,
  ADDON_PRICE_IDS,
  planFromPriceId,
  mapStripeStatus
};

module.exports = stripeService;
