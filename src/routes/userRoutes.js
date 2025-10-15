import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { userController } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Auth rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// Auth
router.post('/register', userController.register);
router.post('/login', loginLimiter, userController.login);
router.post('/refresh', userController.refresh);

// Self service
router.get('/me', requireAuth, userController.me);
router.patch('/me', requireAuth, userController.updateMe);

// Admin
router.get('/', requireAuth, requireRole('admin'), userController.list);
router.get('/:id', requireAuth, requireRole('admin'), userController.getById);
router.patch('/:id', requireAuth, requireRole('admin'), userController.adminUpdate);

export default router;
