const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  account_number: {
    type: mongoose.Schema.Types.UUID,
    default: () => new mongoose.Types.UUID().toString(),
    required: true,
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
    type: Number,
    min: 0,
    default: 0,
  },
});

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
