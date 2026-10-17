import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, AuthController.register);
router.post('/login', authLimiter, validateLogin, AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
