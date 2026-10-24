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

module.exports = {
  createUser,
};
