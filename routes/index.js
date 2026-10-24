const usersRouter = require('./users.routes');

module.exports = (app) => {
  app.use('/users', usersRouter);
};
