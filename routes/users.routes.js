const { Router } = require('express');
const userController = require('../controllers/users.controller');

const router = Router();

router.route('/').get(userController.find).post(userController.createUser);

module.exports = router;
