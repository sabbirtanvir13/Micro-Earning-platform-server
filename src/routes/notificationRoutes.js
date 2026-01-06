import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get notifications
router.get('/', authenticate, getNotifications);

// Mark notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all as read
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
