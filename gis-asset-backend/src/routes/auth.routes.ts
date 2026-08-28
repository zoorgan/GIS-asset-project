import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { loginValidator, registerValidator } from '../dto/auth.dto';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account (always created with VIEWER role) and receive a JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, confirmPassword]
 *             properties:
 *               username: { type: string, minLength: 3, maxLength: 64, example: jane_doe }
 *               password: { type: string, minLength: 8, example: SecurePass123 }
 *               confirmPassword: { type: string, example: SecurePass123 }
 *     responses:
 *       201:
 *         description: Account created, JWT issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     expiresIn: { type: string, example: 8h }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         username: { type: string }
 *                         role: { type: string, example: VIEWER }
 *       400:
 *         description: Validation error (weak password, invalid username, passwords don't match)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/register', registerValidator, validateRequest, asyncHandler(authController.register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and receive a JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: Admin@123 }
 *     responses:
 *       200:
 *         description: JWT issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     expiresIn: { type: string, example: 8h }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         username: { type: string }
 *                         role: { type: string, example: ADMIN }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/login', loginValidator, validateRequest, asyncHandler(authController.login));

export default router;
