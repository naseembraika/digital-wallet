const express = require('express');
const globalMiddleware = require('./middlewares/globalMiddleware');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

globalMiddleware(app);

routes(app);

app.use(errorHandler);

module.exports = app;
