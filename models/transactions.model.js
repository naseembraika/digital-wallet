const mongoose = require('mongoose');

const TransactionsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['internal', 'external'],
    default: 'internal',
  },
  amount: {
    type: Number,
    min: 1,
    required: true,
  },
  senderAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  receiverAccount: {
    type: mongoose.Types.ObjectId,
    ref: 'users',
  },
  receiverUUIDAccount: {
    type: mongoose.Types.UUID,
  },
  idempotencyKey: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('transactions', TransactionsSchema);
