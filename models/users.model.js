const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    default: () => {
      const buffer = crypto.randomBytes(8);
      const bigIntString = BigInt(`0x${buffer.toString('hex')}`).toString();
      const accountNumber = `DIGITAL${bigIntString.slice(bigIntString.length - 17)}`;
      return accountNumber;
    },
    unique: true,
  },
  name: {
    type: String,
    minlength: 3,
    maxlength: 24,
    required: true,
    trim: true,
  },
  balance: {
    type: mongoose.Types.Double,
    min: 0,
    default: 0,
  },
});

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
