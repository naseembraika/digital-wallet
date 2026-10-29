const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

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

const ExternalTransaction = Transactions.discriminator(
  'ExternalTransaction',
  new mongoose.Schema(
    {
      reference: {
        type: mongoose.Types.UUID,
        default: randomUUID(),
        unique: true,
      },
      bankCode: { type: String, required: true },
      accountNumber: { type: String, required: true },
      beneficiaryName: { type: String, required: true },
      currency: { type: String, required: true },
      notes: [String],
      paymentType: { type: Number, required: true },
      chargeDetails: { type: String, required: true },
    },
    { discriminatorKey: 'kind' },
  ),
);

module.exports = {
  Transactions,
  InternalTransaction,
  ExternalTransaction,
};
