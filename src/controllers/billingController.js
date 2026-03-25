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
      const periodEnd = new Date(subscription.current_period_end * 1000);

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

      await client.update({
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });

      // Send cancellation email
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

    default:
      // Unhandled event type — ignore
      break;
  }
}

module.exports = billingController;
