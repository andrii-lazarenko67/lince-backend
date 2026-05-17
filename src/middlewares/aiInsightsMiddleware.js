'use strict';

const { Client } = require('../../db/models');

/**
 * AI Insights Middleware
 * Checks monthly AI usage limit before allowing AI calls.
 * Resets counter if billing period has rolled over.
 * Increments counter after successful response.
 * Skips check for service providers.
 */
async function aiInsightsMiddleware(req, res, next) {
  try {
    // Service providers are never limited
    if (req.user?.isServiceProvider) return next();

    // No client context — let through (edge case during onboarding)
    if (!req.clientId) return next();

    const client = await Client.findByPk(req.clientId, {
      attributes: ['id', 'aiInsightsUsed', 'aiInsightsLimit', 'aiInsightsResetDate', 'currentPeriodEnd']
    });

    if (!client) return next();

    // If limit is 0, it means unlimited — skip check
    if (client.aiInsightsLimit === 0) return next();

    // Check if reset date has passed — if so, reset counter
    const now = new Date();
    if (client.aiInsightsResetDate && new Date(client.aiInsightsResetDate) <= now) {
      await client.update({
        aiInsightsUsed: 0,
        aiInsightsResetDate: client.currentPeriodEnd || null
      });
      client.aiInsightsUsed = 0;
    }

    // Check limit
    if (client.aiInsightsUsed >= client.aiInsightsLimit) {
      return res.status(403).json({
        success: false,
        messageKey: 'ai.errors.insightsLimitReached'
      });
    }

    // Intercept res.json to increment counter only on success
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body && body.success === true) {
        Client.increment('aiInsightsUsed', { by: 1, where: { id: req.clientId } })
          .catch(err => console.error('[AIInsightsMiddleware] Failed to increment:', err.message));
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('[AIInsightsMiddleware] Error:', error.message);
    next();
  }
}

module.exports = aiInsightsMiddleware;
