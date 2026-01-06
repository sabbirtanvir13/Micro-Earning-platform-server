import express from 'express';
import { body } from 'express-validator';
import {
  createWithdrawal,
  getWorkerWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
} from '../controllers/withdrawalController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorker, requireAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Create withdrawal (workers)
router.post(
  '/',
  authenticate,
  requireWorker,
  [
    body('coins').isInt({ min: 200 }).withMessage('Minimum withdrawal is 200 coins'),
    body('paymentMethod').isIn(['paypal', 'bank', 'crypto']),
    body('paymentDetails').isObject().withMessage('Payment details are required'),
  ],
  validate,
  createWithdrawal
);

// Get worker's withdrawals
router.get('/worker/my-withdrawals', authenticate, requireWorker, getWorkerWithdrawals);

// Get all withdrawals (admin)
router.get('/all', authenticate, requireAdmin, getAllWithdrawals);

// Approve withdrawal (admin)
router.patch('/:id/approve', authenticate, requireAdmin, approveWithdrawal);

// Reject withdrawal (admin)
router.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  [body('rejectionReason').optional().isString()],
  validate,
  rejectWithdrawal
);

// Process withdrawal (admin)
router.patch('/:id/process', authenticate, requireAdmin, processWithdrawal);

export default router;
