'use strict';

/**
 * Plan limits configuration
 * 0 = unlimited
 */
const PLAN_LIMITS = {
  none:       { systemsLimit: 3,  usersLimit: 5,  aiInsightsLimit: 50,  storageLimit: 5368709120 },
  starter:    { systemsLimit: 3,  usersLimit: 5,  aiInsightsLimit: 50,  storageLimit: 5368709120 },
  pro:        { systemsLimit: 18, usersLimit: 25, aiInsightsLimit: 200, storageLimit: 26843545600 },
  enterprise: { systemsLimit: 0,  usersLimit: 0,  aiInsightsLimit: 0,   storageLimit: 0 }
};

/**
 * Get limits for a given plan
 * @param {string} plan - 'none' | 'starter' | 'pro' | 'enterprise'
 * @returns {{ systemsLimit, usersLimit, aiInsightsLimit }}
 */
function getLimitsForPlan(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['none'];
}

module.exports = { PLAN_LIMITS, getLimitsForPlan };
