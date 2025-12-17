const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { login, logout } = require('../../controllers/app/appAuthController');

/**
 * @swagger
 * tags:
 *   name: App Auth
 *   description: Mobile app authentication APIs
 */

/**
 * @swagger
 * /api/app/auth/login:
 *   post:
 *     summary: User login (Mobile App)
 *     tags: [App Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token for push notifications
 *                 example: "eK5...xyz"
 *               deviceInfo:
 *                 type: object
 *                 description: Device information (recommended for multi-device support)
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     example: "unique_device_id_12345"
 *                     description: Unique device identifier (required for logout by device)
 *                   deviceName:
 *                     type: string
 *                     example: "Samsung Galaxy S21"
 *                   osVersion:
 *                     type: string
 *                     example: "12.0"
 *                   appVersion:
 *                     type: string
 *                     example: "1.0.0"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         number:
 *                           type: string
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: integer
 *                         role_names:
 *                           type: array
 *                           items:
 *                             type: string
 *                         address:
 *                           type: object
 *                           properties:
 *                             doorno:
 *                               type: string
 *                             street:
 *                               type: string
 *                             city:
 *                               type: string
 *                             district:
 *                               type: string
 *                             state:
 *                               type: string
 *                             country:
 *                               type: string
 *                             pincode:
 *                               type: string
 *                         distributor:
 *                           type: string
 *                           nullable: true
 *                         local_distributor:
 *                           type: string
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         modified_at:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/app/auth/logout:
 *   post:
 *     summary: User logout (Mobile App) - Removes FCM token
 *     tags: [App Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcm_token:
 *                 type: string
 *                 description: FCM token to remove
 *                 example: "eK5...xyz"
 *               deviceId:
 *                 type: string
 *                 description: Device ID to remove (alternative to fcm_token)
 *                 example: "device_12345"
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;