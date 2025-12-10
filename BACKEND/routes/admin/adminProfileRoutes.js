const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const {
    getProfile,
    updateProfile
} = require('../../controllers/admin/adminController');

/**
 * @swagger
 * tags:
 *   name: Admin Profile
 *   description: Admin profile management APIs
 */

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile by profile ID
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Profile ID (user_id)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Profile fetched successfully
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
 *                   example: "Profile fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     number:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     role_names:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     modified_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Profile ID is required
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               number:
 *                 type: string
 *                 example: "+1234567890"
 *               status:
 *                 type: boolean
 *                 example: true
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Email cannot be updated
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
