'use strict';

const { Client, UserClient, User } = require('../../db/models');

/**
 * Subscription middleware — blocks access for self-registered end-customer clients whose
 * subscription has expired or been cancelled. Must run AFTER authMiddleware.
 *
 * WHO is exempt from the subscription check:
 *  1. Service providers (isServiceProvider === true) — they manage other clients.
 *  2. Users of clients that were created by a service provider — the service provider
 *     handles the business relationship; the platform does not gate those users.
 *     (Identified by: the client's owner is a service provider.)
 *
 * WHO is checked:
 *  Self-registered end customers whose client's ownerId is a non-service-provider user.
 *  Their client must have a valid subscription or active trial to access data routes.
 */
async function subscriptionMiddleware(req, res, next) {
  try {
    // 1. Service providers are never gated
    if (req.user?.isServiceProvider) return next();

    // 2. Resolve which client this user belongs to
    let clientId = req.headers['x-client-id'] || req.query.clientId;

    if (!clientId) {
      const userClient = await UserClient.findOne({ where: { userId: req.user.id } });
      if (!userClient) {
        // No client association — edge case during onboarding, let through
        return next();
      }
      clientId = userClient.clientId;
    }

    const client = await Client.findByPk(parseInt(clientId, 10), {
      attributes: ['id', 'ownerId', 'subscriptionStatus', 'trialEndsAt']
    });

    if (!client) return next();

    // 3. If the client was created by a service provider, skip subscription check
    if (client.ownerId) {
      const owner = await User.findByPk(client.ownerId, { attributes: ['id', 'isServiceProvider'] });
      if (owner?.isServiceProvider) return next();
    }

    // 4. Check subscription status for self-registered end-customer clients
    const now = new Date();
    const status = client.subscriptionStatus;

    if (status === 'active' || status === 'past_due') return next();

    if (status === 'trialing') {
      if (client.trialEndsAt && new Date(client.trialEndsAt) > now) {
        return next();
      }
      return res.status(402).json({
        success: false,
        code: 'TRIAL_EXPIRED',
        messageKey: 'billing.errors.trialExpired'
      });
    }

    if (status === 'cancelled') {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_CANCELLED',
        messageKey: 'billing.errors.subscriptionCancelled'
      });
    }

    if (status === 'expired' || status === 'none') {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        messageKey: 'billing.errors.subscriptionExpired'
      });
    }

    return next();
  } catch (error) {
    console.error('[SubscriptionMiddleware] Error checking subscription:', error.message);
    return next();
  }
}

module.exports = subscriptionMiddleware;
