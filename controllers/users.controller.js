const UserModel = require('../models/users.model');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../errors/AppError');
const factory = require('./factory');

const createUser = asyncHandler(async (req, res, next) => {
  const result = await factory.create(UserModel, req.body);
  res.status(201).json({
    status: 'success',
    data: result,
  });
});

const getUsers = asyncHandler(async (req, res, next) => {
  const users = await factory.find(UserModel);
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

const getUserById = asyncHandler(async (req, res, next) => {
  const user = await factory.findOne(UserModel, { _id: req.params.id });
  if (!user) throw new AppError(404, 'User not found');
  res.status(200).json({
    status: 'success',
    data: user,
  });
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
};
