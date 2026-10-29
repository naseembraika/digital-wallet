const { Router } = require('express');
const userController = require('../controllers/users.controller');

const router = Router();

router.route('/').get(userController.getUsers).post(userController.createUser);
router.get('/:id', userController.getUserById);

module.exports = router;
