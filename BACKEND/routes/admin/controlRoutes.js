const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const { cacheMiddleware } = require('../../middleware/cache');
const {
    getmodels,
    getControlById,
    createControl,
    updateControl,
    deleteControl
} = require('../../controllers/admin/controlController');

/**
 * @swagger
 * tags:
 *   name: models
 *   description: Control management APIs
 */

/**
 * @swagger
 * /api/admin/models:
 *   get:
 *     summary: Get all models with pagination
 *     tags: [models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: models fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: "Control Panel A"
 *                       quantity:
 *                         type: number
 *                         example: 100
 *                       created_by:
 *                         type: string
 *                         example: "admin@example.com"
 *                       created_time:
 *                         type: string
 *                         format: date-time
 *                       modified_by:
 *                         type: string
 *                         nullable: true
 *                       modified_time:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       status:
 *                         type: boolean
 *                         example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/models', authMiddleware, pagination, cacheMiddleware('models', 300), getmodels);

/**
 * @swagger
 * /api/admin/models/{uid}:
 *   get:
 *     summary: Get a control by UID
 *     tags: [models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Control UID
 *     responses:
 *       200:
 *         description: Control fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Control not found
 *       500:
 *         description: Server error
 */
router.get('/models/:uid', authMiddleware, getControlById);

/**
 * @swagger
 * /api/admin/models:
 *   post:
 *     summary: Create a new control
 *     tags: [models]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Control Panel A"
 *               quantity:
 *                 type: number
 *                 example: 100
 *               created_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: Control created successfully
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
 *                   example: "Control created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/models', authMiddleware, createControl);

/**
 * @swagger
 * /api/admin/models/{uid}:
 *   put:
 *     summary: Update a control
 *     tags: [models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Control UID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - modified_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Control Panel A Updated"
 *               quantity:
 *                 type: number
 *                 example: 150
 *               modified_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Control updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Control not found
 *       500:
 *         description: Server error
 */
router.put('/models/:uid', authMiddleware, updateControl);

/**
 * @swagger
 * /api/admin/models/{uid}:
 *   delete:
 *     summary: Delete a control (soft delete)
 *     tags: [models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Control UID
 *     responses:
 *       200:
 *         description: Control deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Control not found
 *       500:
 *         description: Server error
 */
router.delete('/models/:uid', authMiddleware, deleteControl);

module.exports = router;
