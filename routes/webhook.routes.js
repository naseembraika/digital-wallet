const { Router } = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = Router();

router.post('/:bank/:accountNumber', webhookController.receiveWebhook);

module.exports = router;
