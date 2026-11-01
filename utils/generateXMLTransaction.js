const xml = require('xml');

module.exports = (transaction, senderAccount) => {
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
