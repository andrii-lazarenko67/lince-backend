'use strict';

const { Op } = require('sequelize');
const { Client } = require('../../db/models');
const emailService = require('../services/emailService');
const stripeService = require('../services/stripeService');

/**
 * Schedule a function to run once daily at a specific UTC hour.
 * After each run it re-schedules for the next day at the same hour.
 */
function scheduleDailyAt(utcHour, label, fn) {
  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(utcHour, 0, 0, 0);
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    const delayMs = next - now;
    const delayMin = Math.round(delayMs / 60000);
    console.log(`[Cron] "${label}" scheduled in ${delayMin} min (${next.toUTCString()})`);

    setTimeout(async () => {
      console.log(`[Cron] Running "${label}"`);
      try {
        await fn();
      } catch (err) {
        console.error(`[Cron] "${label}" failed:`, err.message);
      }
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();
}

/**
 * 1. EXPIRE STALE TRIALS
 * Runs at 01:00 UTC.
 * Finds trialing clients whose trialEndsAt has passed and marks them 'expired'.
 * Sends a "trial_expired" notification email.
 */
async function expireTrials() {
  const now = new Date();

  const stale = await Client.findAll({
    where: {
      subscriptionStatus: 'trialing',
      trialEndsAt: { [Op.lt]: now }
    }
  });

  for (const client of stale) {
    await client.update({ subscriptionStatus: 'expired' });

    if (client.email) {
      await emailService.sendSubscriptionEmail({
        to: client.email,
        type: 'trial_expired',
        clientName: client.name
      }).catch(err => console.warn(`[Cron] expireTrials: email failed for ${client.id}:`, err.message));
    }

    console.log(`[Cron] expireTrials: client ${client.id} "${client.name}" expired`);
  }

  if (stale.length > 0) {
    console.log(`[Cron] expireTrials: ${stale.length} client(s) expired`);
  }
}

/**
 * 2. TRIAL REMINDER EMAILS
 * Runs at 08:00 UTC.
 *
 * Sends "trial_ending" email when 6–8 days remain (≈7 day reminder).
 * Sends "trial_ending_final" email when 20–36 hours remain (≈1 day reminder).
 * trialReminderSentAt prevents duplicate sends within the same window.
 */
async function sendTrialReminders() {
  const now = new Date();

  // 7-day window: trial ends between 6d and 8d from now
  const in6d = new Date(now.getTime() + 6 * 86400000);
  const in8d = new Date(now.getTime() + 8 * 86400000);

  // 1-day window: trial ends between 20h and 36h from now
  const in20h = new Date(now.getTime() + 20 * 3600000);
  const in36h = new Date(now.getTime() + 36 * 3600000);

  // 7-day reminder — skip if reminder already sent in last 5 days
  const lastSent7d = new Date(now.getTime() - 5 * 86400000);
  const sevenDayClients = await Client.findAll({
    where: {
      subscriptionStatus: 'trialing',
      trialEndsAt: { [Op.between]: [in6d, in8d] },
      [Op.or]: [
        { trialReminderSentAt: null },
        { trialReminderSentAt: { [Op.lt]: lastSent7d } }
      ]
    }
  });

  for (const client of sevenDayClients) {
    const daysLeft = Math.ceil((new Date(client.trialEndsAt) - now) / 86400000);
    if (client.email) {
      await emailService.sendSubscriptionEmail({
        to: client.email,
        type: 'trial_ending',
        clientName: client.name,
        daysLeft
      }).catch(err => console.warn(`[Cron] 7d reminder: email failed for ${client.id}:`, err.message));
    }
    await client.update({ trialReminderSentAt: now });
    console.log(`[Cron] 7-day reminder sent to client ${client.id} (${daysLeft} days left)`);
  }

  // 1-day reminder — skip if reminder already sent in last 12h
  const lastSent1d = new Date(now.getTime() - 12 * 3600000);
  const oneDayClients = await Client.findAll({
    where: {
      subscriptionStatus: 'trialing',
      trialEndsAt: { [Op.between]: [in20h, in36h] },
      [Op.or]: [
        { trialReminderSentAt: null },
        { trialReminderSentAt: { [Op.lt]: lastSent1d } }
      ]
    }
  });

  for (const client of oneDayClients) {
    if (client.email) {
      await emailService.sendSubscriptionEmail({
        to: client.email,
        type: 'trial_ending_final',
        clientName: client.name,
        daysLeft: 1
      }).catch(err => console.warn(`[Cron] 1d reminder: email failed for ${client.id}:`, err.message));
    }
    await client.update({ trialReminderSentAt: now });
    console.log(`[Cron] 1-day reminder sent to client ${client.id}`);
  }
}

/**
 * 3. ESCALATE PAST-DUE SUBSCRIPTIONS
 * Runs at 02:00 UTC.
 *
 * If a subscription has been past_due for more than 21 days, cancel it via Stripe.
 * The customer.subscription.deleted webhook will then set status to 'cancelled'.
 */
async function escalatePastDue() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 21 * 86400000); // 21 days ago

  const overdueClients = await Client.findAll({
    where: {
      subscriptionStatus: 'past_due',
      stripeSubscriptionId: { [Op.ne]: null },
      currentPeriodEnd: { [Op.lt]: cutoff }
    }
  });

  for (const client of overdueClients) {
    try {
      await stripeService.cancelSubscription(client.stripeSubscriptionId);
      // webhook customer.subscription.deleted will update status to 'cancelled'
      console.log(`[Cron] escalatePastDue: cancelled subscription for client ${client.id} "${client.name}"`);
    } catch (err) {
      console.warn(`[Cron] escalatePastDue: failed to cancel client ${client.id}:`, err.message);
    }
  }

  if (overdueClients.length > 0) {
    console.log(`[Cron] escalatePastDue: processed ${overdueClients.length} client(s)`);
  }
}

/**
 * Start all billing cron jobs. Call once at server startup.
 */
function startBillingCron() {
  console.log('[Cron] Initialising billing cron jobs');
  scheduleDailyAt(1, 'expireTrials', expireTrials);
  scheduleDailyAt(2, 'escalatePastDue', escalatePastDue);
  scheduleDailyAt(8, 'sendTrialReminders', sendTrialReminders);
}

module.exports = { startBillingCron, expireTrials, sendTrialReminders, escalatePastDue };
