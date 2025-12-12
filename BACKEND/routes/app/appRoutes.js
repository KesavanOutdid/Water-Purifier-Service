const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const appTaskRoutes = require('./appTaskRoutes');
const { uploadProfilePic } = require('../../middleware/uploadMiddleware');
const {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    getProfilePicture
} = require('../../controllers/app/appProfileController');

/**
 * @swagger
 * tags:
 *   name: App Profile
 *   description: Mobile app user profile management APIs
 */

/**
 * @swagger
 * /api/app/profile:
 *   get:
 *     summary: Get user profile (Mobile App)
 *     tags: [App Profile]
 *     security:
 *       - bearerAuth: []
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
 *                     id:
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
 *                     address:
 *                       type: object
 *                       properties:
 *                         doorno:
 *                           type: string
 *                         street:
 *                           type: string
 *                         city:
 *                           type: string
 *                         district:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                     distributor:
 *                       type: string
 *                       nullable: true
 *                     local_distributor:
 *                       type: string
 *                       nullable: true
 *                     profile_pic:
 *                       type: string
 *                       nullable: true
 *                       example: "uploads/profile-pics/abc123.jpg"
 *                     status:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     modified_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/app/profile:
 *   put:
 *     summary: Update user profile (Mobile App)
 *     tags: [App Profile]
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
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *               address:
 *                 type: object
 *                 properties:
 *                   doorno:
 *                     type: string
 *                     example: "123"
 *                   street:
 *                     type: string
 *                     example: "Main Street"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   district:
 *                     type: string
 *                     example: "Manhattan"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   pincode:
 *                     type: string
 *                     example: "10001"
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
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @swagger
 * /api/app/profile/picture:
 *   post:
 *     summary: Upload or update profile picture (Mobile App)
 *     tags: [App Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profile_pic
 *             properties:
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file (all image formats allowed, max 15MB)
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
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
 *                   example: "Profile picture uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_pic:
 *                       type: string
 *                       example: "uploads/profile-pics/abc123.jpg"
 *       400:
 *         description: File validation error
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/profile/picture', authMiddleware, uploadProfilePic.single('profile_pic'), uploadProfilePicture);

/**
 * @swagger
 * /api/app/profile/picture:
 *   get:
 *     summary: Get user profile picture (Mobile App)
 *     tags: [App Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture retrieved successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *           image/bmp:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Profile picture not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/profile/picture', authMiddleware, getProfilePicture);

router.use('/', appTaskRoutes);

module.exports = router;
