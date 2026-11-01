const AppError = require('../errors/AppError');

module.exports = async (Model, idempotencyKey) => {
  const doc = await Model.findOne({ idempotencyKey });
  if (doc) throw new AppError(400, 'This request processed before');
};
