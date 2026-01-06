import express from 'express';
import { body } from 'express-validator';
import {
  verifyFirebase,
  selectRole,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// POST /api/auth/verify-firebase
router.post(
  '/verify-firebase',
  [body('idToken').notEmpty().withMessage('Firebase token is required')],
  validate,
  verifyFirebase
);

// POST /api/auth/select-role
router.post(
  '/select-role',
  authenticate,
  [
    body('role')
      .isIn(['worker', 'buyer', 'admin'])
      .withMessage('Role must be worker, buyer, or admin'),
  ],
  validate,
  selectRole
);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
