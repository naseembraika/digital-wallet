const mongoose = require('mongoose');

const TransactionsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['internal', 'external'],
    default: 'internal',
    required: true,
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
  idempotencyKey: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Transactions = mongoose.model('transactions', TransactionsSchema);

const InternalTransaction = Transactions.discriminator(
  'InternalTransaction',
  new mongoose.Schema(
    {
      receiverAccount: {
        type: mongoose.Types.ObjectId,
        ref: 'users',
        required: true,
      },
    },
    { discriminatorKey: 'kind' },
  ),
);

module.exports = {
  Transactions,
  InternalTransaction,
};
