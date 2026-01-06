import express from 'express';
import { body } from 'express-validator';
import {
  getAvailableTasks,
  getTaskById,
  createTask,
  getBuyerTasks,
  updateTaskStatus,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireBuyer, requireWorker } from '../middleware/role.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Get available tasks (workers)
router.get('/available', authenticate, requireWorker, getAvailableTasks);

// Get task by ID
router.get('/:id', authenticate, getTaskById);

// Create task (buyers)
router.post(
  '/',
  authenticate,
  requireBuyer,
  [
    body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 }),
    body('coinsPerWorker').isInt({ min: 1 }).withMessage('Coins per worker must be at least 1'),
    body('requiredWorkers')
      .isInt({ min: 1 })
      .withMessage('Required workers must be at least 1'),
  ],
  validate,
  createTask
);

// Get buyer's tasks
router.get('/buyer/my-tasks', authenticate, requireBuyer, getBuyerTasks);

// Update task status
router.patch(
  '/:id/status',
  authenticate,
  requireBuyer,
  [body('status').isIn(['open', 'in_progress', 'completed', 'cancelled'])],
  validate,
  updateTaskStatus
);

export default router;
