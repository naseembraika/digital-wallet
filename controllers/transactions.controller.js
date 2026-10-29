const {
  Transactions,
  InternalTransaction,
  ExternalTransaction,
} = require('../models/transactions.model');
const UserModel = require('../models/users.model');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../errors/AppError');
const mongoose = require('mongoose');
const xml = require('xml');
const factory = require('./factory');

const findOneUser = async (filter, session) => {
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

const checkIdempotencyKeyExists = async (idempotencyKey) => {
  const doc = await factory.findOne(Transactions, { idempotencyKey });
  if (doc) throw new AppError(400, 'This request processed before');
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
      const senderAccount = await findOneUser({ _id: data.senderId }, session);
      if (!senderAccount)
        throw new AppError(404, "Sender doesn't have account");
      if (data.amount > senderAccount.balance || data.amount < 0)
        throw new AppError(400, "Sender doesn't have enough money");

      // Check if receiver account exists
      const receiverAccount = await findOneUser(
        { _id: data.receiverId },
        session,
      );
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

const generateXML = (transaction, senderAccount) => {
  let xmlSchema = {
    PaymentRequestMessage: [
      {
        TransferInfo: [
          { Reference: transaction.reference.toString() },
          { Date: transaction.createdAt.toString() },
          { Amount: transaction.amount },
          { Currency: transaction.currency },
        ],
      },
      {
        SenderInfo: [{ AccountNumber: senderAccount.accountNumber.toString() }],
      },
      {
        ReceiverInfo: [
          { BankCode: transaction.bankCode },
          { AccountNumber: transaction.accountNumber },
          { BeneficiaryName: transaction.beneficiaryName },
        ],
      },
    ],
  };

  if (transaction.notes.length > 0) {
    let notes = [];
    transaction.notes.forEach((note) => notes.push({ Note: note }));
    xmlSchema.PaymentRequestMessage.push({ Notes: notes });
  }
  if (transaction.paymentType != 99) {
    xmlSchema.PaymentRequestMessage.push({
      PaymentType: transaction.paymentType,
    });
  }
  if (transaction.chargeDetails !== 'SHA') {
    xmlSchema.PaymentRequestMessage.push({
      ChargeDetails: transaction.chargeDetails,
    });
  }

  return xml([xmlSchema], { declaration: true });
};

const sendExternal = asyncHandler(async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Check if idempotency key is exists
      await checkIdempotencyKeyExists(idempotencyKey);

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
      const updateSender = await factory.findOneAndUpdateBySession(
        UserModel,
        { _id: senderAccount._id },
        { $inc: { balance: -amountNeeded } },
        session,
      );

      // Create external transaction
      const transaction = new ExternalTransaction({
        ...requestBody,
        senderAccount: senderAccount._id,
      });
      await transaction.save({ session });

      const xmlString = generateXML(transaction, senderAccount);

      res.status(201).json({
        status: 'success',
        message: 'Data transferred successfully',
        data: {
          transaction,
          updateSender,
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
