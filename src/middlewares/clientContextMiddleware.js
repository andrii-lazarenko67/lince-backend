/**
 * Client Context Middleware
 *
 * Extracts clientId from request headers or query params for service provider mode.
 * When a user's organization is a service provider, they can filter data by client.
 */
const clientContextMiddleware = (req, res, next) => {
  // Get clientId from header or query parameter
  const clientId = req.headers['x-client-id'] || req.query.clientId;

  // Only set clientId context if user has an organization that is a service provider
  if (req.user?.organization?.isServiceProvider && clientId) {
    req.clientId = parseInt(clientId, 10);
  }

  next();
};

module.exports = clientContextMiddleware;
