const { Router } = require('express');
const userController = require('../controllers/users.controller');

const router = Router();

router.route('/').post(userController.createUser);

module.exports = router;
