const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

module.exports = (app) => {
  app.use(express.json());
  app.use(express.text());
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan('dev'));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100,
    }),
  );
};
