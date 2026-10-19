const express = require('express');
const {
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
  downloadInvoice
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', handlePaymentWebhook);
router.get('/:id/invoice', protect, downloadInvoice);

module.exports = router;
