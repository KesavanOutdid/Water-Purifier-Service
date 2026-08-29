const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { getParts } = require('../../controllers/app/appPartsController');

/**
 * @swagger
 * tags:
 *   name: App-Parts
 *   description: Parts APIs for mobile app
 */

/**
 * @swagger
 * /api/app/parts:
 *   get:
 *     summary: Get all parts (Mobile App)
 *     tags: [App-Parts]
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
 *                         example: "Filter replacement"
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

module.exports = router;
