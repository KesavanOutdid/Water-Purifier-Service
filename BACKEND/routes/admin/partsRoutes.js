const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const {
    createPart,
    getParts,
    getPartById,
    updatePart,
    deletePart
} = require('../../controllers/admin/partsController');

/**
 * @swagger
 * tags:
 *   name: Parts
 *   description: Parts management APIs
 */

/**
 * @swagger
 * /api/admin/parts:
 *   post:
 *     summary: Create a new part
 *     tags: [Parts]
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
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Filter replacement"
 *               created_by:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user creating the part
 *     responses:
 *       201:
 *         description: Part created successfully
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
 *                   example: "Part created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     part_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     created_by:
 *                       type: string
 *                       format: email
 *                       example: "admin@example.com"
 *                       description: Email ID of the user who created the part
 *                     created_time:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       format: email
 *                       nullable: true
 *                       example: "modifier@example.com"
 *                       description: Email ID of the user who last modified the part
 *                     modified_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *       400:
 *         description: Validation error or part already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/parts', authMiddleware, createPart);

/**
 * @swagger
 * /api/admin/parts:
 *   get:
 *     summary: Get all parts
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parts fetched successfully
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
 *                       part_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       created_by:
 *                         type: string
 *                         format: email
 *                         example: "admin@example.com"
 *                         description: Email ID of the user who created the part
 *                       created_time:
 *                         type: string
 *                         format: date-time
 *                       modified_by:
 *                         type: string
 *                         format: email
 *                         nullable: true
 *                         example: "modifier@example.com"
 *                         description: Email ID of the user who last modified the part
 *                       modified_time:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       status:
 *                         type: boolean
 *                 count:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/parts', authMiddleware, getParts);

/**
 * @swagger
 * /api/admin/parts/{part_id}:
 *   get:
 *     summary: Get part by ID
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: part_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Part UUID
 *     responses:
 *       200:
 *         description: Part fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     part_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     created_by:
 *                       type: string
 *                       format: email
 *                       example: "admin@example.com"
 *                       description: Email ID of the user who created the part
 *                     created_time:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       format: email
 *                       nullable: true
 *                       example: "modifier@example.com"
 *                       description: Email ID of the user who last modified the part
 *                     modified_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Part not found
 *       500:
 *         description: Server error
 */
router.get('/parts/:part_id', authMiddleware, getPartById);

/**
 * @swagger
 * /api/admin/parts/{part_id}:
 *   put:
 *     summary: Update a part
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: part_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Part UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - modified_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Filter replacement"
 *               modified_by:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user modifying the part
 *     responses:
 *       200:
 *         description: Part updated successfully
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
 *                   example: "Part updated successfully"
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Part not found
 *       500:
 *         description: Server error
 */
router.put('/parts/:part_id', authMiddleware, updatePart);

/**
 * @swagger
 * /api/admin/parts/{part_id}:
 *   delete:
 *     summary: Delete a part (soft delete)
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: part_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Part UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modified_by
 *             properties:
 *               modified_by:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user deleting the part
 *     responses:
 *       200:
 *         description: Part deleted successfully
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
 *                   example: "Part deleted successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Part not found
 *       500:
 *         description: Server error
 */
router.delete('/parts/:part_id', authMiddleware, deletePart);

module.exports = router;
