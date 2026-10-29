const { Router } = require('express');
const transactionsController = require('../controllers/transactions.controller');

const router = Router();

router.post('/send/internal', transactionsController.sendInternal);
router.post('/send/external', transactionsController.sendExternal);

module.exports = router;
