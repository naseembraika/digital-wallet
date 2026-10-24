require('dotenv').config({ silent: true });
const app = require('./app');

const server = app;
server.listen(process.env.PORT);
