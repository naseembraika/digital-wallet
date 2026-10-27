const UserModel = require('../models/users.model');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../errors/AppError');

const createUser = asyncHandler(async (req, res, next) => {
  const result = await UserModel.create(req.body);
  res.status(201).json({
    status: 'success',
    data: result,
  });
});

const find = asyncHandler(async (req, res, next) => {
  const users = await UserModel.find();
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

module.exports = {
  createUser,
  find,
};
