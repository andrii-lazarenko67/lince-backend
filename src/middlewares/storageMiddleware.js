'use strict';
const { Client } = require('../../db/models');

/**
 * Storage Middleware
 * Blocks file uploads when client storage limit is exceeded.
 * Skips check for service providers and unlimited plans (limit = 0).
 */
async function storageMiddleware(req, res, next) {
  try {
    if (req.user?.isServiceProvider) return next();
    if (!req.clientId) return next();
    if (!req.file && (!req.files || req.files.length === 0)) return next();

    const client = await Client.findByPk(req.clientId, {
      attributes: ['id', 'storageUsed', 'storageLimit']
    });
    if (!client) return next();
    if (client.storageLimit === 0) return next(); // unlimited

    if (client.storageUsed >= client.storageLimit) {
      return res.status(507).json({
        success: false,
        messageKey: 'errors.storageLimitReached'
      });
    }
    next();
  } catch (error) {
    console.error('[StorageMiddleware] Error:', error.message);
    next();
  }
}

module.exports = storageMiddleware;
