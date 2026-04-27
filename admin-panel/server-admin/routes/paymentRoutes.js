const express = require('express');
const paymentController = require('../controllers/paymentController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// All payment routes require authentication
router.use(adminAuthMiddleware);

// Get all payments
router.get('/', paymentController.getAllPayments);

// Get payment stats
router.get('/stats', paymentController.getPaymentStats);

// Get payments for a specific user
router.get('/user/:userId', paymentController.getPaymentsByUserId);

// Create new payment
router.post('/', paymentController.createPayment);

// Update payment
router.put('/:id', paymentController.updatePayment);

// Update payment status (PATCH)
router.patch('/:id', paymentController.updatePaymentStatus);

// Delete payment
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
