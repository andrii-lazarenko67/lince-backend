'use strict';
const { getLimitsForPlan } = require('../config/planLimits');

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
          isOwner,
          systemsUsed: client.systemsUsed,
          systemsLimit: client.systemsLimit,
          usersUsed: client.usersUsed,
          usersLimit: client.usersLimit,
          aiInsightsUsed: client.aiInsightsUsed,
          aiInsightsLimit: client.aiInsightsLimit,
          storageUsed: client.storageUsed,
          storageLimit: client.storageLimit
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
   * POST /api/billing/change-plan
   * Upgrade or downgrade — creates a new Stripe Checkout session so the user pays
   * Body: { plan: 'starter' | 'pro' }
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
      const subscription = await stripeService.changeSubscriptionPlan(client.stripeSubscriptionId, plan);
      const periodEndTs = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;
      await client.update({
        plan,
        subscriptionStatus: stripeService.mapStripeStatus(subscription.status),
        currentPeriodEnd: periodEndTs ? new Date(periodEndTs * 1000) : client.currentPeriodEnd
      });
      console.log(`[Billing] Plan changed for client ${client.id}: ${client.plan} to ${plan}`);
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
  async syncSession(req, res, next) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId required' });
      }
      const client = await resolveOwnClient(req);
      const session = await stripeService.getCheckoutSession(sessionId);
      if (session.mode !== 'subscription' || session.status !== 'complete') {
        return res.json({ success: true, synced: false, message: 'Session not yet complete' });
      }
      if (session.metadata?.clientId !== String(client.id)) {
        return res.status(403).json({ success: false, message: 'Session does not belong to this client' });
      }
      const updates = {};
      if (session.customer && !client.stripeCustomerId) {
        updates.stripeCustomerId = session.customer;
      }
      if (session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const subscription = await stripeService.getSubscription(subId);
        const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
        const status = stripeService.mapStripeStatus(subscription.status);
        const periodEndTs = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;
        updates.plan = plan;
        updates.subscriptionStatus = status;
        updates.stripeSubscriptionId = subscription.id;
        updates.currentPeriodEnd = periodEndTs ? new Date(periodEndTs * 1000) : null;
        updates.trialEndsAt = null;
      }
      if (Object.keys(updates).length > 0) {
        await client.update(updates);
      }
      console.log(`[Billing] syncSession: synced client ${client.id} from session ${sessionId}`);
      res.json({ success: true, synced: true });
    } catch (error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, messageKey: 'billing.errors.clientNotFound' });
      }
      next(error);
    }
  },

  /**
   * POST /api/billing/sync-invoices
   * Fetch latest invoices from Stripe and sync to database
   */
  async syncInvoices(req, res, next) {
    try {
      const { client } = await resolveClientForStatus(req);

      if (!client.stripeCustomerId) {
        return res.json({ success: true, data: [] });
      }

      // Fetch invoices from Stripe
      const stripeInvoices = await stripeService.listInvoices(client.stripeCustomerId, 50);

      // Sync to database
      const invoices = [];
      for (const inv of stripeInvoices) {
        const plan = stripeService.planFromPriceId(inv.lines?.data?.[0]?.price?.id) || client.plan || 'none';
        const defaults = {
          clientId: client.id,
          stripeInvoiceId: inv.id,
          stripePaymentIntentId: inv.payment_intent || null,
          amount: inv.amount_paid || inv.amount_due || 0,
          currency: inv.currency || 'brl',
          status: inv.status || 'open',
          plan,
          pdfUrl: inv.invoice_pdf || null,
          periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
          periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
          paidAt: inv.status === 'paid' && inv.status_transitions?.paid_at
            ? new Date(inv.status_transitions.paid_at * 1000) : null
        };

        const [invoice, created] = await Invoice.findOrCreate({
          where: { stripeInvoiceId: inv.id },
          defaults
        });

        if (!created) {
          await invoice.update({ status: defaults.status, pdfUrl: defaults.pdfUrl });
        }

        invoices.push(invoice);
      }

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
   * POST /api/billing/create-addon-checkout
   * Creates a Stripe checkout session for an add-on purchase
   * Body: { addonType: 'user' | 'storage_10' | 'storage_25' | 'storage_50', quantity: number }
   */
  async createAddonCheckout(req, res, next) {
    try {
      const { addonType, quantity = 1 } = req.body;
      const validAddons = ['user', 'storage_10', 'storage_25', 'storage_50'];

      if (!addonType || !validAddons.includes(addonType)) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.invalidAddon' });
      }
      if (quantity < 1 || quantity > 100) {
        return res.status(400).json({ success: false, messageKey: 'billing.errors.invalidQuantity' });
      }

      const client = await resolveOwnClient(req);

      const session = await stripeService.createAddonCheckoutSession({
        client,
        addonType,
        quantity: parseInt(quantity),
        ownerEmail: req.user.email,
        ownerName: req.user.name,
        successUrl: `${FRONTEND_URL}/billing/success`,
        cancelUrl: `${FRONTEND_URL}/billing`
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
   * GET /api/billing/admin
   * Admin only — list all clients with subscription info
   */
  async adminList(req, res, next) {
    try {
      let whereClause = {};

      // Service providers only see their own clients
      if (req.user.isServiceProvider) {
        const userClients = await UserClient.findAll({
          where: { userId: req.user.id },
          attributes: ['clientId']
        });
        const clientIds = userClients.map(uc => uc.clientId);
        whereClause = { id: clientIds };
      }

      const clients = await Client.findAll({
        where: whereClause,
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
      if (plan) {
        updates.plan = plan;
        // Apply plan limits when plan is changed manually
        const limits = getLimitsForPlan(plan);
        updates.systemsLimit = limits.systemsLimit;
        updates.usersLimit = limits.usersLimit;
        updates.aiInsightsLimit = limits.aiInsightsLimit;
        updates.storageLimit = limits.storageLimit;
      }
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

      const invoiceLimits = getLimitsForPlan(plan);
      await client.update({
        subscriptionStatus: 'active',
        plan,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        systemsLimit: invoiceLimits.systemsLimit,
        usersLimit: invoiceLimits.usersLimit,
        aiInsightsLimit: invoiceLimits.aiInsightsLimit,
        storageLimit: invoiceLimits.storageLimit
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
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
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
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null
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

    // Checkout completed — first-time subscription setup
    case 'checkout.session.completed': {
      const session = data;
      if (session.mode !== 'subscription') break;

      const clientId = session.metadata?.clientId;
      const plan = session.metadata?.plan;
      if (!clientId || !plan) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      // Subscription will be fully activated by invoice.paid event
      // Just ensure stripeCustomerId is saved
      if (session.customer && !client.stripeCustomerId) {
        await client.update({ stripeCustomerId: session.customer });
      }

      console.log(`[Billing] Checkout completed for client ${clientId} — plan: ${plan}`);
      break;
    }

    // Subscription updated (upgrade/downgrade)
    case 'customer.subscription.updated': {
      const subscription = data;
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;

      const plan = stripeService.planFromPriceId(subscription.items.data[0]?.price?.id);
      const status = stripeService.mapStripeStatus(subscription.status);
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

      await client.update({
        plan,
        subscriptionStatus: status,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: periodEnd
      });

      console.log(`[Billing] Subscription updated for client ${clientId} — plan: ${plan}, status: ${status}`);
      break;
    }

    // Subscription cancelled or deleted
    case 'customer.subscription.deleted': {
      const subscription = data;
      const clientId = subscription.metadata?.clientId;
      if (!clientId) break;

      const client = await Client.findByPk(clientId);
      if (!client) break;
      // Only cancel if this is the currently active subscription
      // Prevents stale old webhooks from overriding a newer active subscription
      if (client.stripeSubscriptionId && client.stripeSubscriptionId !== subscription.id) {
        console.log(`[Billing] Ignoring stale cancellation for sub ${subscription.id} — client ${clientId} has active sub ${client.stripeSubscriptionId}`);
        break;
      }

      const cancelPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
      await client.update({
        subscriptionStatus: 'cancelled',
        currentPeriodEnd: cancelPeriodEnd
      });

      // Send cancellation email
      if (client.email) {
        await emailService.sendSubscriptionEmail({
          to: client.email,
          type: 'cancelled',
          clientName: client.name,
          plan: stripeService.PLAN_NAMES[client.plan],
          accessUntil: cancelPeriodEnd ? cancelPeriodEnd.toLocaleDateString('pt-BR') : ''
        }).catch(err => console.warn('[Billing] Failed to send cancelled email:', err.message));
      }

      console.log(`[Billing] Subscription cancelled for client ${clientId}`);
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }
}

module.exports = billingController;
