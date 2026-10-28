const {
  Transactions,
  InternalTransaction,
} = require('../models/transactions.model');
const UserModel = require('../models/users.model');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../errors/AppError');
const mongoose = require('mongoose');

const findOne = async (filter, session) => {
  let query = UserModel.findOne(filter);
  if (session) query.session(session);
  return await query;
};

const findOneAndUpdate = async (filter, update, options, session) => {
  let query = UserModel.findOneAndUpdate(filter, update, options);
  if (session) query.session(session);
  return await query;
};

/**
 *
 * @param {mongoose.Types.ObjectId} userId - User who send or receive money
 * @param {Number} amount - For sender amount is negative | For receiver amount is positive
 * @param {mongoose.ClientSession} session - Transaction session
 * @returns {Promise<mongoose.UpdateWriteOpResult>}
 */
const sendMoney = async (userId, amount, session) => {
  return await findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: amount } },
    { returnDocument: 'after' },
    session,
  );
};

const getIdempotencyKey = (req) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) throw new AppError(400, 'Idempotency key not exists');
  return idempotencyKey;
};

const sendInternal = asyncHandler(async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (req.body.senderId === req.body.receiverId) {
    throw new AppError(400, "User can't send money to himself");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const doc = await Transactions.findOne({ idempotencyKey });

      if (doc) throw new AppError(400, 'This request processed before');

      const data = {
        type: 'internal',
        senderId: req.body.senderId,
        receiverId: req.body.receiverId,
        amount: req.body.amount,
      };

      // Check if sender account exists & have enough money
      const senderAccount = await findOne({ _id: data.senderId }, session);
      if (!senderAccount)
        throw new AppError(404, "Sender doesn't have account");
      if (data.amount > senderAccount.balance || data.amount < 0)
        throw new AppError(400, "Sender doesn't have enough money");

      // Check if receiver account exists
      const receiverAccount = await findOne({ _id: data.receiverId }, session);
      if (!receiverAccount)
        throw new AppError(404, "Receiver doesn't have account");

      // Update sender account balance
      const updateSender = await sendMoney(
        senderAccount._id,
        -data.amount,
        session,
      );

      // Update receiver account balance
      const updateReceiver = await sendMoney(
        receiverAccount._id,
        data.amount,
        session,
      );

      const transaction = new InternalTransaction({
        amount: data.amount,
        senderAccount: senderAccount._id,
        receiverAccount: receiverAccount._id,
        idempotencyKey,
      });
      await transaction.save({ session });

      res.status(200).json({
        status: 'success',
        message: 'Money has transferred successfully',
        data: {
          transaction,
          updateSender,
          updateReceiver,
        },
      });
    });
  } finally {
    await session.endSession();
  }
});

module.exports = {
  sendInternal,
};
