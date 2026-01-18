import express from 'express';
import { body } from 'express-validator';
import {
  verifyFirebase,
  selectRole,
  getMe,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { requireAdmin } from '../middleware/role.js';

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

// PUT /api/auth/profile
router.put('/profile', authenticate, updateProfile);

// Admin: Get all users
router.get('/users', authenticate, requireAdmin, getAllUsers);

// Admin: Update user status
router.patch('/users/status', authenticate, requireAdmin, updateUserStatus);

// Admin: Update user role
router.patch('/users/role', authenticate, requireAdmin, updateUserRole);

export default router;
