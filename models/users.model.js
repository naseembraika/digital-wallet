const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  account_number: {
    type: String,
    default: () => new mongoose.Types.UUID().toString(),
    required: true,
    unique: true,
    match:
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
  },
  name: {
    type: String,
    minlength: 3,
    maxlength: 24,
    required: true,
    trim: true,
  },
  balance: {
    type: Number,
    min: 0,
    default: 0,
  },
});

const UserModule = mongoose.model('users', userSchema);

module.exports = UserModule;
