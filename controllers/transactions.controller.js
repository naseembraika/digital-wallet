const {
  Transactions,
  InternalTransaction,
  ExternalTransaction,
} = require('../models/transactions.model');
const UserModel = require('../models/users.model');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../errors/AppError');
const mongoose = require('mongoose');
const factory = require('./factory');
const getIdempotencyKey = require('../utils/getIdempotencyKey');
const checkIdempotencyKey = require('../utils/checkIdempotencyKey');
const generateXMLTransaction = require('../utils/generateXMLTransaction');

const sendInternal = asyncHandler(async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (req.body.senderId === req.body.receiverId) {
    throw new AppError(400, "User can't send money to himself");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await checkIdempotencyKey(Transactions, idempotencyKey);

      const requestBody = {
        senderId: req.body.senderId,
        receiverId: req.body.receiverId,
        amount: req.body.amount,
      };

      // Check if sender account exists & have enough money
      const senderAccount = await factory.findOneBySession(
        UserModel,
        { _id: requestBody.senderId },
        session,
      );
      if (!senderAccount)
        throw new AppError(404, "Sender doesn't have account");
      if (requestBody.amount > senderAccount.balance)
        throw new AppError(400, "Sender doesn't have enough money");

      // Check if receiver account exists
      const receiverAccount = await factory.findOneBySession(
        UserModel,
        { _id: requestBody.receiverId },
        session,
      );
      if (!receiverAccount)
        throw new AppError(404, "Receiver doesn't have account");

      // Update sender account balance
      senderAccount.balance -= requestBody.amount;
      senderAccount.save({ session });

      // Update receiver account balance
      receiverAccount.balance += requestBody.amount;
      receiverAccount.save({ session });

      const transaction = new InternalTransaction({
        type: 'internal',
        amount: requestBody.amount,
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
          senderAccount,
          receiverAccount,
        },
      });
    });
  } finally {
    await session.endSession();
  }
});

const checkUserHaveEnoughBalance = async (userBalance, requestBody) => {
  // Fetch currency change rate
  const uriLink = process.env.EXCHANGERATE_URI.replace(
    'API',
    process.env.EXCHANGERATE_API,
  ).replace('CURRENCY', requestBody.currency);

  const response = await fetch(uriLink);
  const exchangeData = await response.json();

  if (response.status != 200) {
    throw new AppError(404, exchangeData['error-type']);
  }

  // Convert amountNeeded currency to $ value
  const conversionRate = exchangeData.conversion_rates['USD'];
  const amountNeeded = Number.parseFloat(
    (requestBody.amount * conversionRate).toFixed(2),
  );

  if (amountNeeded > userBalance)
    throw new AppError(400, "Sender doesn't have enough money");

  return amountNeeded;
};

const sendExternal = asyncHandler(async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Check if idempotency key is exists
      await checkIdempotencyKey(Transactions, idempotencyKey);

      const requestBody = {
        ...req.body,
        type: 'external',
        idempotencyKey,
      };

      // Check if sender account is exists
      const senderAccount = await factory.findOneBySession(
        UserModel,
        { accountNumber: requestBody.senderAccount },
        session,
      );
      if (!senderAccount) throw new AppError(404, 'Sender account not exists');

      // Check if user have enough amount of money
      const amountNeeded = await checkUserHaveEnoughBalance(
        senderAccount.balance,
        req.body,
      );

      // Update sender account balance
      senderAccount.balance -= amountNeeded;
      await senderAccount.save({ session });

      // Create external transaction
      const transaction = new ExternalTransaction({
        ...requestBody,
        senderAccount: senderAccount._id,
      });
      await transaction.save({ session });

      const xmlString = generateXMLTransaction(transaction, senderAccount);

      res.status(201).json({
        status: 'success',
        message: 'Data transferred successfully',
        data: {
          transaction,
          senderAccount,
          xml: xmlString,
        },
      });
    });
  } finally {
    await session.endSession();
  }
});

module.exports = {
  sendInternal,
  sendExternal,
};
