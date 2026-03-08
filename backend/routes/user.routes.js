import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { body } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Register Route
router.post('/register',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.createUserController
);

// Login Route
router.post('/login',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.loginController
);

// Profile Route
router.get('/profile', authMiddleware.authUser, userController.profileController);

// Logout Route
router.get('/logout', authMiddleware.authUser, userController.logoutController);

// Get All Users Route (Yehi wo route hai jise hum frontend me call kar rahe hain)
router.get('/all', authMiddleware.authUser, userController.getAllUsersController);

export default router;