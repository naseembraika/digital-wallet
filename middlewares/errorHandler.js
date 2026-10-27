const AppError = require('../errors/AppError');

const normalizeError = (err) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join('. ');
    return new AppError(400, message);
  }

  return err;
};

const sendDevelopmentError = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendProductionError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

module.exports = (err, req, res, next) => {
  err = normalizeError(err);
  if (process.env.NODE_ENV === 'development')
    return sendDevelopmentError(err, res);
  sendProductionError(err, res);
};
