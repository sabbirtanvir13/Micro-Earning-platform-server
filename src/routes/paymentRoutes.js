import express from 'express';
import { body } from 'express-validator';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireBuyer } from '../middleware/role.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Create payment intent
router.post(
  '/create-intent',
  authenticate,
  requireBuyer,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('coins').isInt({ min: 1 }).withMessage('Coins must be at least 1'),
  ],
  validate,
  createPaymentIntent
);

// Confirm payment
router.post(
  '/confirm',
  authenticate,
  requireBuyer,
  [body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')],
  validate,
  confirmPayment
);

// Get payment history
router.get('/history', authenticate, requireBuyer, getPaymentHistory);

export default router;
