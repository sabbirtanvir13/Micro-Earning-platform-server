import express from 'express';
import { body } from 'express-validator';
import {
  createSubmission,
  getWorkerSubmissions,
  getTaskSubmissions,
  approveSubmission,
  rejectSubmission,
} from '../controllers/submissionController.js';
import { authenticate } from '../middleware/auth.js';
import { requireWorker, requireBuyer, requireAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Create submission (workers)
router.post(
  '/',
  authenticate,
  requireWorker,
  [
    body('taskId').notEmpty().withMessage('Task ID is required'),
    body('submissionText')
      .notEmpty()
      .withMessage('Submission text is required')
      .isLength({ max: 2000 }),
  ],
  validate,
  createSubmission
);

// Get worker's submissions
router.get('/worker/my-submissions', authenticate, requireWorker, getWorkerSubmissions);

// Get submissions for a task (buyers/admins)
router.get('/task/:taskId', authenticate, getTaskSubmissions);

// Approve submission (buyers/admins)
router.patch('/:id/approve', authenticate, approveSubmission);

// Reject submission (buyers/admins)
router.patch(
  '/:id/reject',
  authenticate,
  [body('rejectionReason').optional().isString()],
  validate,
  rejectSubmission
);

export default router;
