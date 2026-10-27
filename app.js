const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const morgan = require('morgan');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

routes(app);

app.use(errorHandler);

module.exports = app;
