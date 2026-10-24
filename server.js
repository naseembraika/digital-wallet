require('dotenv').config({ silent: true });
const mongoose = require('mongoose');
const app = require('./app');

const server = app;

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in the environment');
  }

  await mongoose.connect(mongoUri);
  server.listen(process.env.PORT);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
