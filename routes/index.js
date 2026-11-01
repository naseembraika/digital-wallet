const AppError = require('../errors/AppError');
const usersRouter = require('./users.routes');
const transactionsRouter = require('./transactions.routes');
const webhookRouter = require('./webhook.routes');

module.exports = (app) => {
  app.use('/users', usersRouter);
  app.use('/transactions', transactionsRouter);
  app.use('/webhook', webhookRouter);

  app.use((req, res, next) => {
    next(new AppError(404, 'Page Not Found'));
  });
};
