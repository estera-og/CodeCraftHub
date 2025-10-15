/**
 * User routes
 *
 * Maps HTTP paths to controller methods.
 * Public routes:
 *   POST /users/register
 *   POST /users/login
 *   POST /users/refresh
 *
 * Authenticated routes:
 *   GET  /users/me
 *   PATCH /users/me
 *
 * Admin routes:
 *   GET   /users
 *   GET   /users/:id
 *   PATCH /users/:id
 */

import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Public authentication routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);

// Routes for the current user
router.get('/me', requireAuth, userController.me);
router.patch('/me', requireAuth, userController.updateMe);

// Admin only
router.get('/', requireAuth, requireRole('admin'), userController.list);
router.get('/:id', requireAuth, requireRole('admin'), userController.getById);
router.patch('/:id', requireAuth, requireRole('admin'), userController.adminUpdate);

export default router;
