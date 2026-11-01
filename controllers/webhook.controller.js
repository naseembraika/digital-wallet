const Webhook = require('../models/webhooks.model');
const AppError = require('../errors/AppError.js');
const mongoose = require('mongoose');
const UserModel = require('../models/users.model.js');
const asyncHandler = require('../middlewares/asyncHandler');
const factory = require('./factory');
const checkIdempotencyKey = require('../utils/checkIdempotencyKey');
const getIdempotencyKey = require('../utils/getIdempotencyKey');

const sanitizeDate = (date) => {
  const year = date.slice(0, 4);
  const month = Number.parseInt(date.slice(4, 6));
  const day = Number.parseInt(date.slice(6));
  return new Date(year, month - 1, day + 1);
};

const sanitizePayTechBank = (receiverAccount, data) => {
  const chunks = data.split('#');

  const dateMoney = chunks[0].replace(',', '-');
  const noteParts = chunks[2].split('/');

  const notes = [];
  for (let i = 0; i <= noteParts.length; i += 2) {
    if (noteParts[i] !== undefined && noteParts[i + 1] !== undefined) {
      notes.push({ key: noteParts[i], value: noteParts[i + 1] });
    }
  }

  return {
    receiverAccount,
    bank: 'paytech',
    date: sanitizeDate(dateMoney.split('-')[0]),
    amount: Number.parseFloat(dateMoney.split('-')[1].replace(',', '.')),
    reference: chunks[1],
    notes,
  };
};

const sanitizeAcmeBank = (receiverAccount, data) => {
  const chunks = data.split('//');

  return {
    receiverAccount,
    bank: 'acme',
    amount: Number.parseFloat(chunks[0].replace(',', '.')),
    reference: chunks[1],
    date: sanitizeDate(chunks[2]),
  };
};

const receiveWebhook = asyncHandler(async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Check transaction exists
      await checkIdempotencyKey(Webhook, idempotencyKey);

      // Check receiver account exists
      const receiverAccount = await factory.findOneBySession(
        UserModel,
        { accountNumber: req.params.accountNumber },
        session,
      );
      if (!receiverAccount) throw new AppError(404, 'Check the account number');

      let sanitizedData = undefined;
      const bank = req.params.bank.toLowerCase();
      if (bank === 'paytech')
        sanitizedData = sanitizePayTechBank(receiverAccount._id, req.body);
      if (bank === 'acme')
        sanitizedData = sanitizeAcmeBank(receiverAccount._id, req.body);

      // Add idempotency key to data
      sanitizedData['idempotencyKey'] = idempotencyKey;

      // Update receiver balance
      receiverAccount.balance += sanitizedData.amount;
      await receiverAccount.save({ validateBeforeSave: false, session });

      // Create webhook
      const [webhook] = await factory.createBySession(
        Webhook,
        sanitizedData,
        session,
      );

      res.status(201).json({
        status: 'success',
        message: 'User receive money',
        webhook,
      });
    });
  } finally {
    await session.endSession();
  }
});

module.exports = {
  receiveWebhook,
};
