const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  idempotencyKey: {
    type: mongoose.Types.UUID,
    required: true,
    unique: true,
  },
  receiverAccount: {
    type: mongoose.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  bank: {
    type: String,
    enum: ['paytech', 'acme'],
  },
  date: { type: Date, required: true },
  amount: {
    type: mongoose.Types.Double,
    min: 1.0,
    required: true,
  },
  reference: { type: String, required: true },
  notes: [Object],
});

const Webhook = mongoose.model('webhooks', webhookSchema);

module.exports = Webhook;
