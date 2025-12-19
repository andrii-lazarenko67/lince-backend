const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      messageKey: 'common.errors.validationError',
      errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      messageKey: 'common.errors.duplicateEntry',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      messageKey: 'common.errors.invalidToken'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      messageKey: 'common.errors.tokenExpired'
    });
  }

  const statusCode = err.statusCode || 500;

  // If error has messageKey, pass it through; otherwise use generic error
  if (err.messageKey) {
    return res.status(statusCode).json({
      success: false,
      messageKey: err.messageKey,
      messageParams: err.messageParams || {},
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  res.status(statusCode).json({
    success: false,
    messageKey: 'common.errors.internalServerError',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
