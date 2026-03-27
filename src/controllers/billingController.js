'use strict';

const { Client, Invoice, UserClient } = require('../../db/models');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Resolve the client owned by the logged-in user.
 * Used for mutation actions (checkout, portal, invoices) — restricted to the account owner.
 */
async function resolveOwnClient(req) {
  const client = await Client.findOne({ where: { ownerId: req.user.id } });
  if (!client) throw new Error('CLIENT_NOT_FOUND');
  return client;
}

/**
 * Resolve the client for status display — works for both owners and staff members.
 * Falls back to UserClient lookup so staff users can also read their client's billing status.
 */
async function resolveClientForStatus(req) {
  // Try owner lookup first
  let client = await Client.findOne({ where: { ownerId: req.user.id } });
  if (client) return { client, isOwner: true };

  // Fall back to UserClient (staff member of an end-customer client)
  const userClient = await UserClient.findOne({ where: { userId: req.user.id } });
  if (!userClient) throw new Error('CLIENT_NOT_FOUND');

  client = await Client.findByPk(userClient.clientId);
  if (!client) throw new Error('CLIENT_NOT_FOUND');

  return { client, isOwner: false };
}

/**
 * Pull recent invoices from Stripe and upsert them into the local Invoice table.
 * Used as a fallback when webhooks are not delivered (local dev, delayed events).
 */
async function syncInvoicesFromStripe(client) {
  if (!client.stripeCustomerId) return;

  const stripeInvoices = await stripeService.listInvoices(client.stripeCustomerId, 20);

  for (const inv of stripeInvoices) {
    if (!inv.id) continue;

    // Derive plan from line items:
    // 1. metadata.plan on the line item (Stripe new API format)
    // 2. price ID via planFromPriceId (classic format)
    // 3. match description text as last resort
    const lines = inv.lines?.data || [];
    let plan = 'none';
    for (const line of lines) {
      // New API: plan stored in line metadata
      if (line.metadata?.plan && line.metadata.plan !== 'none') {
        plan = line.metadata.plan; break;
      }
      // Classic API: price object on the line
      const priceId = line.price?.id || line.plan?.id ||
        line.parent?.subscription_item_details?.plan?.id;
      const derived = stripeService.planFromPriceId(priceId);
      if (derived !== 'none') { plan = derived; break; }
    }
    // Fallback: use client's current plan (valid when syncing right after a plan change)
    if (plan === 'none') plan = client.plan || 'none';

    const invoiceData = {
      clientId: client.id,
      stripeInvoiceId: inv.id,
      stripePaymentIntentId: inv.payment_intent || null,
      amount: inv.amount_paid || inv.amount_due || 0,
      currency: inv.currency || 'brl',
      status: inv.status === 'paid' ? 'paid' : inv.status === 'void' ? 'void' : inv.status === 'uncollectible' ? 'uncollectible' : 'open',
      plan: plan || client.plan,
      pdfUrl: inv.invoice_pdf || null,
      periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
      periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
      paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null
    };

    const existing = await Invoice.findOne({ where: { stripeInvoiceId: inv.id } });
    if (existing) {
      await existing.update(invoiceData);
    } else {
      await Invoice.create(invoiceData);
    }
  }

  console.log(`[Billing] syncInvoicesFromStripe: synced ${stripeInvoices.length} invoice(s) for client ${client.id}`);
}

const billingController = {

  /**
   * GET /api/billing/status
   * Returns the current subscription status for the logged-in user's client
   */
  async getStatus(req, res, next) {
    try {
      const { client, isOwner } = await resolveClientForStatus(req);

      const now = new Date();
      const isTrialing = client.subscriptionStatus === 'trialing' && client.trialEndsAt && new Date(client.trialEndsAt) > now;
      const isActive = client.subscriptionStatus === 'active';
      const isPastDue = client.subscriptionStatus === 'past_due';

      // Trial expired but status not updated yet — treat as expired
      const trialExpired = client.subscriptionStatus === 'trialing' && client.trialEndsAt && new Date(client.trialEndsAt) <= now;

      const hasAccess = isActive || isPastDue || isTrialing;

      res.json({
        success: true,
        data: {
          plan: client.plan,
          planName: stripeService.PLAN_NAMES[client.plan] || 'Sem Plano',
          status: trialExpired ? 'expired' : client.subscriptionStatus,
          hasAccess,
          isTrialing: isTrialing && !trialExpired,
          trialEndsAt: client.trialEndsAt,
          currentPeriodEnd: client.currentPeriodEnd,
          hasStripeCustomer: !!client.stripeCustomerId,
          hasActiveSubscription: !!client.stripeSubscriptionId && (isActive || isPastDue),
          cancelAtPeriodEnd: !!client.cancelAtPeriodEnd,
          isOwner
        }
      });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/create-checkout
   * Creates a Stripe checkout session for a plan and returns the URL
   * Body: { plan: 'starter' | 'pro' }
   */
  async createCheckout(req, res, next) {
    try {
      const { plan } = req.body;

      if (!plan || !['starter', 'pro'].includes(plan)) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.invalidPlan' });
      }

      const client = await resolveOwnClient(req);

      const session = await stripeService.createCheckoutSession({
        client,
        plan,
        ownerEmail: req.user.email,
        ownerName: req.user.name,
        successUrl: `${FRONTEND_URL}/billing/success`,
        cancelUrl: `${FRONTEND_URL}/billing/cancel`
      });

      res.json({ success: true, data: { url: session.url, sessionId: session.id } });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/portal
   * Creates a Stripe billing portal session so the user can manage their subscription
   */
  async createPortal(req, res, next) {
    try {
      const client = await resolveOwnClient(req);

      if (!client.stripeCustomerId) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.noCustomer' });
      }

      const session = await stripeService.createPortalSession({
        stripeCustomerId: client.stripeCustomerId,
        returnUrl: `${FRONTEND_URL}/billing`
      });

      res.json({ success: true, data: { url: session.url } });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * GET /api/billing/invoices
   * Returns invoice history for the logged-in user's client
   */
  async getInvoices(req, res, next) {
    try {
      const { client } = await resolveClientForStatus(req);

      const invoices = await Invoice.findAll({
        where: { clientId: client.id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json({ success: true, data: invoices });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/webhook
   * Stripe webhook handler — processes all subscription lifecycle events
   * This route must be excluded from JSON body parsing (needs raw body)
   */
  async webhook(req, res) {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await handleStripeEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error('Stripe webhook handler error:', err.message);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  },

  /**
   * POST /api/billing/change-plan
   * Upgrade or downgrade the active subscription plan.
   * Body: { plan: 'starter' | 'pro' }
   *
   * Upgrades charge a prorated amount immediately.
   * Downgrades apply a credit to the next invoice.
   */
  async changePlan(req, res, next) {
    try {
      const { plan } = req.body;

      if (!plan || !['starter', 'pro'].includes(plan)) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.invalidPlan' });
      }

      const client = await resolveOwnClient(req);

      if (!client.stripeSubscriptionId) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.noSubscription' });
      }

      if (client.plan === plan) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.alreadyOnPlan' });
      }

      const previousPlan = client.plan;
      const subscription = await stripeService.changeSubscriptionPlan(client.stripeSubscriptionId, plan);

      // Sync DB immediately without waiting for webhook
      const periodEndTs = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;
      await client.update({
        plan,
        subscriptionStatus: stripeService.mapStripeStatus(subscription.status),
        currentPeriodEnd: periodEndTs ? new Date(periodEndTs * 1000) : client.currentPeriodEnd,
        cancelAtPeriodEnd: !!subscription.cancel_at_period_end
      });

      // Sync invoices directly from Stripe (proration invoice may not arrive via webhook in dev)
      await syncInvoicesFromStripe(client).catch(err =>
        console.warn('[Billing] changePlan: invoice sync failed:', err.message)
      );

      console.log(`[Billing] Plan changed for client ${client.id}: ${previousPlan} → ${plan}`);

      res.json({
        success: true,
        data: {
          plan,
          planName: stripeService.PLAN_NAMES[plan]
        }
      });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, messageKey: error.messageKey });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/sync-invoices
   * Pull latest invoices from Stripe and upsert into the local DB.
   * Fallback for environments where webhooks are not delivered (local dev).
   */
  async syncInvoices(req, res, next) {
    try {
      const { client } = await resolveClientForStatus(req);
      await syncInvoicesFromStripe(client);

      const invoices = await Invoice.findAll({
        where: { clientId: client.id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json({ success: true, data: invoices });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/sync-session
   * Called by CheckoutSuccessPage to sync subscription state directly from Stripe.
   * This is a fallback for environments where webhooks are not delivered (local dev).
   * Body: { sessionId }
   */
  async syncFromSession(req, res, next) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId required' });
      }

      const client = await resolveOwnClient(req);

      const session = await stripeService.getCheckoutSession(sessionId);

      // Only process completed subscription checkouts that belong to this client
      if (session.mode !== 'subscription' || session.status !== 'complete') {
        return res.json({ success: true, synced: false, message: 'Session not yet complete' });
      }

      if (session.metadata?.clientId !== String(client.id)) {
        return res.status(403).json({ success: false, message: 'Session does not belong to this client' });
      }

      // Save customer ID
      const updates = {};
      if (session.customer && !client.stripeCustomerId) {
        updates.stripeCustomerId = session.customer;
      }

      // If we have a subscription, sync it
      if (session.subscription) {
        const subscription = await stripeService.getSubscription(session.subscription);
        const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
        const status = stripeService.mapStripeStatus(subscription.status);
        const periodEndTs = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;

        updates.plan = plan;
        updates.subscriptionStatus = status;
        updates.stripeSubscriptionId = subscription.id;
        updates.currentPeriodEnd = periodEndTs ? new Date(periodEndTs * 1000) : null;
        updates.trialEndsAt = null;
        updates.cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
      }

      if (Object.keys(updates).length > 0) {
        await client.update(updates);
      }

      // Also sync invoices so the history table is up to date immediately
      await syncInvoicesFromStripe(client).catch(err =>
        console.warn('[Billing] syncFromSession: invoice sync failed:', err.message)
      );

      console.log(`[Billing] syncFromSession: synced client ${client.id} from session ${sessionId}`);
      res.json({ success: true, synced: true });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * GET /api/billing/admin
   * Admin only — list all clients with subscription info
   */
  async adminList(req, res, next) {
    try {
      const clients = await Client.findAll({
        attributes: ['id', 'name', 'email', 'plan', 'subscriptionStatus', 'trialEndsAt', 'currentPeriodEnd', 'stripeCustomerId', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/billing/admin/:clientId
   * Admin only — manually override a client's subscription status
   * Body: { plan, subscriptionStatus }
   */
  async adminUpdate(req, res, next) {
    try {
      const { clientId } = req.params;
      const { plan, subscriptionStatus } = req.body;

      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }

      const updates = {};
      if (plan) updates.plan = plan;
      if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus;

      await client.update(updates);

      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }
};

/**
 * Internal Stripe event handler
 */
async function handleStripeEvent(event) {
  const data = event.data.object;

  switch (event.type) {

    // Payment succeeded — activate or renew subscription
    case 'invoice.paid': {
      const invoice = data;
      if (!invoice.subscription) break;

      const subscription = await stripeService.getSubscription(invoice.subscription);
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const periodEnd = new Date(subscription.current_period_end * 1000);

      await client.update({
        subscriptionStatus: 'active',
        plan,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null
      });

      // Record invoice — use findOne + update/create to safely handle webhook retries
      const existingInvoice = await Invoice.findOne({ where: { stripeInvoiceId: invoice.id } });
      const invoiceData = {
        clientId: client.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent || null,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        plan,
        pdfUrl: invoice.invoice_pdf || null,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        paidAt: new Date()
      };
      if (existingInvoice) {
        await existingInvoice.update(invoiceData);
      } else {
        await Invoice.create(invoiceData);
      }

      // Send activation/renewal email
      if (client.email) {
        await emailService.sendSubscriptionEmail({
          to: client.email,
          type: 'activated',
          clientName: client.name,
          plan: stripeService.PLAN_NAMES[plan]
        }).catch(err => console.warn('[Billing] Failed to send activated email:', err.message));
      }

      console.log(`[Billing] Subscription activated/renewed for client ${clientId} — plan: ${plan}`);
      break;
    }

    // Payment failed — mark as past_due
    case 'invoice.payment_failed': {
      const invoice = data;
      if (!invoice.subscription) break;

      const subscription = await stripeService.getSubscription(invoice.subscription);
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      await client.update({ subscriptionStatus: 'past_due' });

      // Record failed invoice — use findOne + update/create to safely handle webhook retries
      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const failedInvoiceData = {
        clientId: client.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'open',
        plan,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000)
      };
      const existingFailedInvoice = await Invoice.findOne({ where: { stripeInvoiceId: invoice.id } });
      if (existingFailedInvoice) {
        await existingFailedInvoice.update(failedInvoiceData);
      } else {
        await Invoice.create(failedInvoiceData);
      }

      // Send payment failed email
      if (client.email) {
        await emailService.sendSubscriptionEmail({
          to: client.email,
          type: 'payment_failed',
          clientName: client.name,
          plan: stripeService.PLAN_NAMES[plan]
        }).catch(err => console.warn('[Billing] Failed to send payment_failed email:', err.message));
      }

      console.log(`[Billing] Payment failed for client ${clientId}`);
      break;
    }

    // Checkout completed — save Stripe IDs immediately; invoice.paid finalises activation
    case 'checkout.session.completed': {
      const session = data;
      if (session.mode !== 'subscription') break;

      const clientId = session.metadata?.clientId;
      const plan = session.metadata?.plan;
      if (!clientId || !plan) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      const updates = {};
      if (session.customer && !client.stripeCustomerId) {
        updates.stripeCustomerId = session.customer;
      }
      if (session.subscription && !client.stripeSubscriptionId) {
        updates.stripeSubscriptionId = session.subscription;
      }
      if (Object.keys(updates).length > 0) {
        await client.update(updates);
      }

      console.log(`[Billing] Checkout completed for client ${clientId} — plan: ${plan}`);
      break;
    }

    // Subscription updated — handles upgrade, downgrade, and portal cancellation scheduling
    case 'customer.subscription.updated': {
      const subscription = data;
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const status = stripeService.mapStripeStatus(subscription.status);
      const periodEnd = new Date(subscription.current_period_end * 1000);
      const cancelAtPeriodEnd = !!subscription.cancel_at_period_end;

      await client.update({
        plan,
        subscriptionStatus: status,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd
      });

      // Notify owner when they schedule a cancellation via portal
      if (cancelAtPeriodEnd && client.email) {
        await emailService.sendSubscriptionEmail({
          to: client.email,
          type: 'cancellation_scheduled',
          clientName: client.name,
          plan: stripeService.PLAN_NAMES[plan],
          accessUntil: periodEnd.toLocaleDateString('pt-BR')
        }).catch(err => console.warn('[Billing] Failed to send cancellation_scheduled email:', err.message));
      }

      console.log(`[Billing] Subscription updated for client ${clientId} — plan: ${plan}, status: ${status}, cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);
      break;
    }

    // Subscription deleted — fired when period ends after cancel_at_period_end, or immediate cancel
    case 'customer.subscription.deleted': {
      const subscription = data;
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      await client.update({
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });

      if (client.email) {
        await emailService.sendSubscriptionEmail({
          to: client.email,
          type: 'cancelled',
          clientName: client.name,
          plan: stripeService.PLAN_NAMES[client.plan],
          accessUntil: new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')
        }).catch(err => console.warn('[Billing] Failed to send cancelled email:', err.message));
      }

      console.log(`[Billing] Subscription cancelled for client ${clientId}`);
      break;
    }

    // Upcoming invoice — renewal reminder (fires ~7 days before renewal date)
    case 'invoice.upcoming': {
      const invoice = data;
      if (!invoice.subscription) break;

      const subscription = await stripeService.getSubscription(invoice.subscription);
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client || !client.email) break;

      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const renewalDate = new Date(invoice.period_end * 1000).toLocaleDateString('pt-BR');
      const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: invoice.currency?.toUpperCase() || 'BRL' }).format(invoice.amount_due / 100);

      await emailService.sendSubscriptionEmail({
        to: client.email,
        type: 'renewal_reminder',
        clientName: client.name,
        plan: stripeService.PLAN_NAMES[plan],
        renewalDate,
        amount
      }).catch(err => console.warn('[Billing] Failed to send renewal_reminder email:', err.message));

      console.log(`[Billing] Renewal reminder sent for client ${clientId} — renews ${renewalDate}`);
      break;
    }

    // Trial ends in 3 days (Stripe built-in event)
    case 'customer.subscription.trial_will_end': {
      const subscription = data;
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client || !client.email) break;

      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const trialEnd = new Date(subscription.trial_end * 1000).toLocaleDateString('pt-BR');

      await emailService.sendSubscriptionEmail({
        to: client.email,
        type: 'trial_ending_final',
        clientName: client.name,
        plan: stripeService.PLAN_NAMES[plan],
        daysLeft: 3,
        trialEnd
      }).catch(err => console.warn('[Billing] Failed to send trial_will_end email:', err.message));

      console.log(`[Billing] Trial will end in 3 days for client ${clientId}`);
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }
}

module.exports = billingController;
