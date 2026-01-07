const { UserClient } = require('../../db/models');

/**
 * Client Context Middleware
 *
 * Extracts clientId from request headers or query params.
 * For end customers: auto-selects their single client if not provided.
 * For service providers: REQUIRES clientId to be specified.
 * Validates that the user has access to the specified client.
 * Sets req.clientId for use in controllers.
 */
const clientContextMiddleware = async (req, res, next) => {
  try {
    // Get clientId from header or query parameter
    let clientId = req.headers['x-client-id'] || req.query.clientId;

    // If no clientId provided, handle based on user type
    if (!clientId) {
      // For end customers (non-service providers), auto-select their single client
      if (!req.user.isServiceProvider) {
        const userClient = await UserClient.findOne({
          where: { userId: req.user.id }
        });

        if (!userClient) {
          return res.status(403).json({
            success: false,
            messageKey: 'errors.noClientAssigned'
          });
        }

        clientId = userClient.clientId;
      } else {
        // For service providers without clientId, allow them to proceed
        // Controllers will handle showing data from all their managed clients
        req.clientId = null;
        return next();
      }
    }

    const parsedClientId = parseInt(clientId, 10);

    if (isNaN(parsedClientId)) {
      return res.status(400).json({
        success: false,
        messageKey: 'errors.invalidClientId'
      });
    }

    // Verify user has access to this client
    const userClient = await UserClient.findOne({
      where: {
        userId: req.user.id,
        clientId: parsedClientId
      }
    });

    if (!userClient) {
      return res.status(403).json({
        success: false,
        messageKey: 'errors.noClientAccess'
      });
    }

    // Set clientId and access level on request
    req.clientId = parsedClientId;
    req.clientAccessLevel = userClient.accessLevel;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = clientContextMiddleware;
