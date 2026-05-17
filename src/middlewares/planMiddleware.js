'use strict';

const { Client, UserClient } = require('../../db/models');

/**
 * Plan middleware — restricts route access based on the client's subscription plan.
 * Usage: planMiddleware('pro', 'enterprise') — only pro and enterprise can access.
 * Must run AFTER authMiddleware.
 */
const planMiddleware = (...allowedPlans) => {
  return async (req, res, next) => {
    try {
      // Service providers are never gated by plan
      if (req.user?.isServiceProvider) return next();

      // Resolve clientId
      let clientId = req.clientId ||
        req.headers['x-client-id'] ||
        req.query.clientId;

      if (!clientId) {
        const userClient = await UserClient.findOne({ where: { userId: req.user.id } });
        if (!userClient) return next();
        clientId = userClient.clientId;
      }

      const client = await Client.findByPk(parseInt(clientId, 10), {
        attributes: ['id', 'plan']
      });

      if (!client) return next();

      if (!allowedPlans.includes(client.plan)) {
        return res.status(403).json({
          success: false,
          code: 'PLAN_LIMIT',
          messageKey: 'billing.errors.planUpgradeRequired',
          requiredPlans: allowedPlans
        });
      }

      return next();
    } catch (error) {
      console.error('[PlanMiddleware] Error:', error.message);
      return next();
    }
  };
};

module.exports = planMiddleware;
