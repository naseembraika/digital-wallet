const AppError = require('../errors/AppError');
const mongoose = require('mongoose');

module.exports = (req) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) throw new AppError(400, 'Idempotency key not exists');
  return new mongoose.Types.UUID(idempotencyKey);
};
