'use strict';

const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO
};

const PLAN_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
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
   * Change the plan of an active subscription (upgrade or downgrade).
   * Uses proration: upgrades charge immediately, downgrades credit the next invoice.
   */
  async changeSubscriptionPlan(subscriptionId, newPlan) {
    const priceId = PLAN_PRICE_IDS[newPlan];
    if (!priceId || !priceId.startsWith('price_')) {
      const err = new Error(`Stripe price ID not configured for plan: ${newPlan}`);
      err.statusCode = 503;
      err.messageKey = 'billing.errors.stripeNotConfigured';
      throw err;
    }

    // Fetch current subscription to get the subscription item ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    const existingItemId = subscription.items.data[0]?.id;
    if (!existingItemId) {
      throw new Error('No subscription item found');
    }

    // Update to new price with prorations
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: existingItemId, price: priceId }],
      proration_behavior: 'always_invoice',  // creates + charges an invoice immediately
      metadata: { plan: newPlan }            // keep metadata in sync for webhook handlers
    });

    return updated;
  },

  /**
   * Cancel a subscription immediately
   */
  async cancelSubscription(subscriptionId) {
    return await stripe.subscriptions.cancel(subscriptionId);
  },

  /**
   * List invoices for a Stripe customer
   */
  async listInvoices(stripeCustomerId, limit = 20) {
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit,
      expand: ['data.payment_intent', 'data.lines.data.price']
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

  PLAN_NAMES,
  planFromPriceId,
  mapStripeStatus
};

module.exports = stripeService;
