/**
 * E2E Billing Test Script
 * Tests each Stripe webhook scenario against the real database.
 * Usage: node scripts/testBillingE2E.js
 *
 * WARNING: This script modifies real DB rows — use test client only.
 */
'use strict';

require('dotenv').config();

const { Client, Invoice, sequelize } = require('../db/models');
const { expireTrials, sendTrialReminders, escalatePastDue } = require('../src/cron/billingCron');

// ──────────────────────────────────────────────────────────
// CONFIG — test client in DB (cliente@endcustomer.com → id:4)
// ──────────────────────────────────────────────────────────
const TEST_CLIENT_ID = 4;
const FAKE_STRIPE_CUSTOMER_ID = 'cus_UDrxzWbMB21Mlg';
const FAKE_SUBSCRIPTION_ID = 'sub_test_' + Date.now();
const FAKE_INVOICE_ID = 'in_test_' + Date.now();
const FAKE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER;
const FAKE_PRICE_PRO = process.env.STRIPE_PRICE_PRO;

// ──────────────────────────────────────────────────────────
// MOCK Stripe API calls (prevent real Stripe calls in tests)
// ──────────────────────────────────────────────────────────
const stripeService = require('../src/services/stripeService');
const origGetSubscription = stripeService.getSubscription.bind(stripeService);

function mockGetSubscription(subscriptionId, overrides = {}) {
  stripeService.getSubscription = async () => ({
    id: subscriptionId || FAKE_SUBSCRIPTION_ID,
    status: 'active',
    cancel_at_period_end: false,
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    trial_end: null,
    metadata: { clientId: String(TEST_CLIENT_ID) },
    items: { data: [{ price: { id: FAKE_PRICE_STARTER } }] },
    ...overrides
  });
}

function restoreGetSubscription() {
  stripeService.getSubscription = origGetSubscription;
}

// Silence email sends in tests
const emailService = require('../src/services/emailService');
const origSendEmail = emailService.sendSubscriptionEmail.bind(emailService);
const emailsSent = [];
emailService.sendSubscriptionEmail = async (opts) => {
  emailsSent.push(opts);
  console.log(`  [Email] type=${opts.type} to=${opts.to}`);
};

// ──────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────
const stripeServiceModule = require('../src/services/stripeService');

// We need to call the internal handleStripeEvent — expose it from controller
// by importing the module and extracting the private fn via a trick
// (We'll call billingController.webhook handler but bypass sig verification)
let handleStripeEvent;
{
  // Patch stripeService.constructWebhookEvent so we can call webhook handler directly
  const controller = require('../src/controllers/billingController');

  // Extract handleStripeEvent by calling webhook with a fake request
  // Instead, we'll re-implement a thin wrapper here
  const billingController = controller;

  // Build a fake req/res to call the webhook route handler
  handleStripeEvent = async (event) => {
    // Bypass webhook signature check — call controller.webhook with pre-verified event
    const fakeReq = {
      headers: { 'stripe-signature': 'test' },
      body: Buffer.from(JSON.stringify(event))
    };
    const fakeRes = {
      json: () => {},
      status: (code) => ({ json: (d) => { if (code !== 200) console.error('  [Webhook] Error response:', code, d); } }),
      send: () => {}
    };

    // Temporarily patch constructWebhookEvent
    const orig = stripeServiceModule.constructWebhookEvent;
    stripeServiceModule.constructWebhookEvent = () => event;

    await billingController.webhook(fakeReq, fakeRes);

    stripeServiceModule.constructWebhookEvent = orig;
  };
}

async function getClient() {
  return Client.findByPk(TEST_CLIENT_ID);
}

async function resetClient(overrides = {}) {
  await Client.update({
    plan: 'none',
    subscriptionStatus: 'trialing',
    stripeCustomerId: FAKE_STRIPE_CUSTOMER_ID,
    stripeSubscriptionId: null,
    trialEndsAt: new Date(Date.now() + 14 * 86400000),
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialReminderSentAt: null,
    ...overrides
  }, { where: { id: TEST_CLIENT_ID } });
  await Invoice.destroy({ where: { clientId: TEST_CLIENT_ID, stripeInvoiceId: { [require('sequelize').Op.like]: '%test%' } } });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    process.exitCode = 1;
  }
}

async function printState(label) {
  const c = await getClient();
  console.log(`\n  [${label}]`);
  console.log(`    status: ${c.subscriptionStatus} | plan: ${c.plan}`);
  console.log(`    subscriptionId: ${c.stripeSubscriptionId || '(none)'}`);
  console.log(`    cancelAtPeriodEnd: ${c.cancelAtPeriodEnd}`);
  console.log(`    currentPeriodEnd: ${c.currentPeriodEnd ? c.currentPeriodEnd.toISOString().slice(0,10) : '(none)'}`);
}

// ══════════════════════════════════════════════════════════
// TEST CASES
// ══════════════════════════════════════════════════════════

async function test_checkoutCompleted() {
  console.log('\n━━━ TEST 1: checkout.session.completed ━━━');
  await resetClient();

  await handleStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        mode: 'subscription',
        customer: FAKE_STRIPE_CUSTOMER_ID,
        subscription: FAKE_SUBSCRIPTION_ID,
        metadata: { clientId: String(TEST_CLIENT_ID), plan: 'starter' }
      }
    }
  });

  const c = await getClient();
  await printState('after checkout.session.completed');
  assert('stripeCustomerId saved', c.stripeCustomerId === FAKE_STRIPE_CUSTOMER_ID);
  assert('stripeSubscriptionId saved', c.stripeSubscriptionId === FAKE_SUBSCRIPTION_ID);
  // Status stays trialing until invoice.paid
  assert('status still trialing (awaiting invoice.paid)', c.subscriptionStatus === 'trialing');
}

async function test_invoicePaid() {
  console.log('\n━━━ TEST 2: invoice.paid (subscription activation) ━━━');
  await resetClient({ stripeSubscriptionId: FAKE_SUBSCRIPTION_ID });

  mockGetSubscription(FAKE_SUBSCRIPTION_ID);

  const periodEnd = new Date(Date.now() + 30 * 86400000);

  await handleStripeEvent({
    type: 'invoice.paid',
    data: {
      object: {
        id: FAKE_INVOICE_ID,
        subscription: FAKE_SUBSCRIPTION_ID,
        payment_intent: 'pi_test_123',
        amount_paid: 14900,
        currency: 'brl',
        invoice_pdf: 'https://stripe.com/test.pdf',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(periodEnd.getTime() / 1000)
      }
    }
  });

  restoreGetSubscription();

  const c = await getClient();
  await printState('after invoice.paid');
  assert('status = active', c.subscriptionStatus === 'active');
  assert('plan = starter', c.plan === 'starter');
  assert('currentPeriodEnd set', !!c.currentPeriodEnd);
  assert('trialEndsAt cleared', c.trialEndsAt === null);

  const inv = await Invoice.findOne({ where: { stripeInvoiceId: FAKE_INVOICE_ID } });
  assert('Invoice record created', !!inv);
  assert('Invoice status = paid', inv?.status === 'paid');
  assert('Invoice amount = 14900', inv?.amount === 14900);
  assert('Invoice plan = starter', inv?.plan === 'starter');
  assert('Invoice pdfUrl set', !!inv?.pdfUrl);

  const activationEmail = emailsSent.find(e => e.type === 'activated');
  assert('Activation email sent', !!activationEmail);

  emailsSent.length = 0;
}

async function test_invoicePaymentFailed() {
  console.log('\n━━━ TEST 3: invoice.payment_failed ━━━');
  await resetClient({ subscriptionStatus: 'active', plan: 'starter', stripeSubscriptionId: FAKE_SUBSCRIPTION_ID });

  mockGetSubscription(FAKE_SUBSCRIPTION_ID);

  const failedInvoiceId = 'in_test_failed_' + Date.now();

  await handleStripeEvent({
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: failedInvoiceId,
        subscription: FAKE_SUBSCRIPTION_ID,
        amount_due: 14900,
        currency: 'brl',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor((Date.now() + 30 * 86400000) / 1000)
      }
    }
  });

  restoreGetSubscription();

  const c = await getClient();
  await printState('after invoice.payment_failed');
  assert('status = past_due', c.subscriptionStatus === 'past_due');

  const inv = await Invoice.findOne({ where: { stripeInvoiceId: failedInvoiceId } });
  assert('Failed invoice recorded', !!inv);
  assert('Invoice status = open', inv?.status === 'open');

  const failEmail = emailsSent.find(e => e.type === 'payment_failed');
  assert('Payment failed email sent', !!failEmail);

  emailsSent.length = 0;
}

async function test_subscriptionUpdated_cancelScheduled() {
  console.log('\n━━━ TEST 4: customer.subscription.updated (cancel_at_period_end) ━━━');
  await resetClient({ subscriptionStatus: 'active', plan: 'starter', stripeSubscriptionId: FAKE_SUBSCRIPTION_ID });

  const periodEnd = new Date(Date.now() + 25 * 86400000);

  await handleStripeEvent({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: FAKE_SUBSCRIPTION_ID,
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: Math.floor(periodEnd.getTime() / 1000),
        metadata: { clientId: String(TEST_CLIENT_ID) },
        items: { data: [{ price: { id: FAKE_PRICE_STARTER } }] }
      }
    }
  });

  const c = await getClient();
  await printState('after subscription.updated (cancel scheduled)');
  assert('status still active', c.subscriptionStatus === 'active');
  assert('cancelAtPeriodEnd = true', c.cancelAtPeriodEnd === true);
  assert('currentPeriodEnd set', !!c.currentPeriodEnd);

  const cancelEmail = emailsSent.find(e => e.type === 'cancellation_scheduled');
  assert('Cancellation scheduled email sent', !!cancelEmail);

  emailsSent.length = 0;
}

async function test_subscriptionUpdated_reactivated() {
  console.log('\n━━━ TEST 5: customer.subscription.updated (reactivation — clear cancel) ━━━');
  await resetClient({
    subscriptionStatus: 'active', plan: 'starter',
    stripeSubscriptionId: FAKE_SUBSCRIPTION_ID, cancelAtPeriodEnd: true
  });

  const periodEnd = new Date(Date.now() + 25 * 86400000);

  await handleStripeEvent({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: FAKE_SUBSCRIPTION_ID,
        status: 'active',
        cancel_at_period_end: false,
        current_period_end: Math.floor(periodEnd.getTime() / 1000),
        metadata: { clientId: String(TEST_CLIENT_ID) },
        items: { data: [{ price: { id: FAKE_PRICE_PRO } }] }
      }
    }
  });

  const c = await getClient();
  await printState('after subscription.updated (reactivated)');
  assert('cancelAtPeriodEnd cleared', c.cancelAtPeriodEnd === false);
  assert('plan updated to pro', c.plan === 'pro');
}

async function test_subscriptionDeleted() {
  console.log('\n━━━ TEST 6: customer.subscription.deleted ━━━');
  await resetClient({ subscriptionStatus: 'active', plan: 'starter', stripeSubscriptionId: FAKE_SUBSCRIPTION_ID, cancelAtPeriodEnd: true });

  const periodEnd = new Date(Date.now() + 5 * 86400000);

  await handleStripeEvent({
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: FAKE_SUBSCRIPTION_ID,
        current_period_end: Math.floor(periodEnd.getTime() / 1000),
        metadata: { clientId: String(TEST_CLIENT_ID) },
        items: { data: [{ price: { id: FAKE_PRICE_STARTER } }] }
      }
    }
  });

  const c = await getClient();
  await printState('after subscription.deleted');
  assert('status = cancelled', c.subscriptionStatus === 'cancelled');
  assert('stripeSubscriptionId cleared', c.stripeSubscriptionId === null);
  assert('cancelAtPeriodEnd reset', c.cancelAtPeriodEnd === false);
  assert('currentPeriodEnd set to future', !!c.currentPeriodEnd);

  const cancelEmail = emailsSent.find(e => e.type === 'cancelled');
  assert('Cancellation email sent', !!cancelEmail);

  emailsSent.length = 0;
}

async function test_cronExpireTrials() {
  console.log('\n━━━ TEST 7: CRON — expireTrials ━━━');
  // Set trial as already expired (trialEndsAt in the past)
  await resetClient({
    subscriptionStatus: 'trialing',
    trialEndsAt: new Date(Date.now() - 2 * 86400000) // 2 days ago
  });

  const before = await getClient();
  assert('Pre-condition: status = trialing', before.subscriptionStatus === 'trialing');

  await expireTrials();

  const c = await getClient();
  await printState('after expireTrials cron');
  assert('status = expired', c.subscriptionStatus === 'expired');

  const expiredEmail = emailsSent.find(e => e.type === 'trial_expired');
  assert('Trial expired email sent', !!expiredEmail);

  emailsSent.length = 0;
}

async function test_cronTrialReminder7Day() {
  console.log('\n━━━ TEST 8: CRON — 7-day trial reminder ━━━');
  await resetClient({
    subscriptionStatus: 'trialing',
    trialEndsAt: new Date(Date.now() + 7 * 86400000), // expires in 7 days
    trialReminderSentAt: null
  });

  await sendTrialReminders();

  const c = await getClient();
  await printState('after sendTrialReminders (7-day)');
  assert('trialReminderSentAt set', !!c.trialReminderSentAt);

  const reminderEmail = emailsSent.find(e => e.type === 'trial_ending');
  assert('7-day reminder email sent', !!reminderEmail);

  // Run again — should NOT send duplicate
  emailsSent.length = 0;
  await sendTrialReminders();
  const dupeEmail = emailsSent.find(e => e.type === 'trial_ending');
  assert('No duplicate 7-day email (trialReminderSentAt gate)', !dupeEmail);

  emailsSent.length = 0;
}

async function test_cronTrialReminder1Day() {
  console.log('\n━━━ TEST 9: CRON — 1-day trial reminder ━━━');
  await resetClient({
    subscriptionStatus: 'trialing',
    trialEndsAt: new Date(Date.now() + 24 * 3600000), // expires in 24 hours
    trialReminderSentAt: null
  });

  await sendTrialReminders();

  const c = await getClient();
  await printState('after sendTrialReminders (1-day)');
  assert('trialReminderSentAt set', !!c.trialReminderSentAt);

  const finalEmail = emailsSent.find(e => e.type === 'trial_ending_final');
  assert('1-day reminder email sent', !!finalEmail);

  emailsSent.length = 0;
}

async function test_cronEscalatePastDue() {
  console.log('\n━━━ TEST 10: CRON — escalate past_due → cancel ━━━');
  // Set past_due with currentPeriodEnd 25 days ago (> 21-day threshold)
  await resetClient({
    subscriptionStatus: 'past_due',
    plan: 'starter',
    stripeSubscriptionId: 'sub_nonexistent_skip',
    currentPeriodEnd: new Date(Date.now() - 25 * 86400000)
  });

  // Mock cancelSubscription to avoid real Stripe API call
  const orig = require('../src/services/stripeService').cancelSubscription;
  let cancelCalled = false;
  require('../src/services/stripeService').cancelSubscription = async (id) => {
    cancelCalled = true;
    console.log(`  [Mock] cancelSubscription(${id}) called`);
  };

  await escalatePastDue();

  require('../src/services/stripeService').cancelSubscription = orig;

  assert('cancelSubscription was called for overdue client', cancelCalled);
  console.log('  (Status remains past_due — webhook customer.subscription.deleted will update it)');
}

async function test_resubscription() {
  console.log('\n━━━ TEST 11: RE-SUBSCRIPTION (cancelled → active) ━━━');
  await resetClient({
    subscriptionStatus: 'cancelled',
    plan: 'none',
    stripeSubscriptionId: null,
    stripeCustomerId: FAKE_STRIPE_CUSTOMER_ID
  });

  const newSubId = 'sub_resubscribe_' + Date.now();
  const newInvoiceId = 'in_resub_' + Date.now();

  mockGetSubscription(newSubId, { items: { data: [{ price: { id: FAKE_PRICE_PRO } }] } });

  // Simulate: user went through new checkout → checkout.session.completed
  await handleStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        mode: 'subscription',
        customer: FAKE_STRIPE_CUSTOMER_ID,
        subscription: newSubId,
        metadata: { clientId: String(TEST_CLIENT_ID), plan: 'pro' }
      }
    }
  });

  // Then invoice.paid fires
  await handleStripeEvent({
    type: 'invoice.paid',
    data: {
      object: {
        id: newInvoiceId,
        subscription: newSubId,
        payment_intent: 'pi_resub_123',
        amount_paid: 34900,
        currency: 'brl',
        invoice_pdf: 'https://stripe.com/resub.pdf',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor((Date.now() + 30 * 86400000) / 1000)
      }
    }
  });

  restoreGetSubscription();

  const c = await getClient();
  await printState('after re-subscription (cancelled → active)');
  assert('status = active', c.subscriptionStatus === 'active');
  assert('plan = pro', c.plan === 'pro');
  assert('new subscriptionId saved', c.stripeSubscriptionId === newSubId);

  const inv = await Invoice.findOne({ where: { stripeInvoiceId: newInvoiceId } });
  assert('Invoice created for re-subscription', !!inv);
  assert('Invoice amount = 34900', inv?.amount === 34900);

  const reactivationEmail = emailsSent.find(e => e.type === 'activated');
  assert('Activation email sent on re-subscription', !!reactivationEmail);

  emailsSent.length = 0;
}

async function test_invoiceUpcoming() {
  console.log('\n━━━ TEST 12: invoice.upcoming (renewal reminder) ━━━');
  await resetClient({ subscriptionStatus: 'active', plan: 'starter', stripeSubscriptionId: FAKE_SUBSCRIPTION_ID });

  mockGetSubscription(FAKE_SUBSCRIPTION_ID);

  await handleStripeEvent({
    type: 'invoice.upcoming',
    data: {
      object: {
        subscription: FAKE_SUBSCRIPTION_ID,
        amount_due: 14900,
        currency: 'brl',
        period_end: Math.floor((Date.now() + 30 * 86400000) / 1000)
      }
    }
  });

  restoreGetSubscription();

  const renewalEmail = emailsSent.find(e => e.type === 'renewal_reminder');
  assert('Renewal reminder email sent', !!renewalEmail);

  emailsSent.length = 0;
}

async function test_trialWillEnd() {
  console.log('\n━━━ TEST 13: customer.subscription.trial_will_end ━━━');
  await resetClient({ subscriptionStatus: 'trialing', plan: 'starter', stripeSubscriptionId: FAKE_SUBSCRIPTION_ID });

  await handleStripeEvent({
    type: 'customer.subscription.trial_will_end',
    data: {
      object: {
        id: FAKE_SUBSCRIPTION_ID,
        trial_end: Math.floor((Date.now() + 3 * 86400000) / 1000),
        metadata: { clientId: String(TEST_CLIENT_ID) },
        items: { data: [{ price: { id: FAKE_PRICE_STARTER } }] }
      }
    }
  });

  const trialEndEmail = emailsSent.find(e => e.type === 'trial_ending_final');
  assert('Trial ending final email sent (3 days)', !!trialEndEmail);

  emailsSent.length = 0;
}

// ══════════════════════════════════════════════════════════
// RUNNER
// ══════════════════════════════════════════════════════════

async function run() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   LINCE Billing E2E Test Suite           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Using client ID: ${TEST_CLIENT_ID} (cliente@endcustomer.com)`);

  try {
    await test_checkoutCompleted();
    await test_invoicePaid();
    await test_invoicePaymentFailed();
    await test_subscriptionUpdated_cancelScheduled();
    await test_subscriptionUpdated_reactivated();
    await test_subscriptionDeleted();
    await test_cronExpireTrials();
    await test_cronTrialReminder7Day();
    await test_cronTrialReminder1Day();
    await test_cronEscalatePastDue();
    await test_resubscription();
    await test_invoiceUpcoming();
    await test_trialWillEnd();

    // Restore clean state
    await resetClient();
    console.log('\n━━━ Test client restored to clean trialing state ━━━');

    console.log('\n╔══════════════════════════════════════════╗');
    if (process.exitCode === 1) {
      console.log('║   SOME TESTS FAILED — see ✗ above       ║');
    } else {
      console.log('║   ALL TESTS PASSED ✓                     ║');
    }
    console.log('╚══════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('\nFATAL ERROR:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
