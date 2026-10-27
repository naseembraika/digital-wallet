const { Router } = require('express');
const transactionsController = require('../controllers/transactions.controller');

const router = Router();

router.post('/send/internal', transactionsController.sendInternal);

module.exports = router;
