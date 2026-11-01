const { Router } = require('express');
const transactionsController = require('../controllers/transactions.controller');

const router = Router();

router.post('/send/:type', transactionsController.send);

module.exports = router;
