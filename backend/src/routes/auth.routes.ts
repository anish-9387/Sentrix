import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate, validateRefreshToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/refresh', validateRefreshToken, authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.get('/my-activity', authenticate, authController.myActivity);

export default router;
