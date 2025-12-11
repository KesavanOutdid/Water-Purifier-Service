const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const {
    getModules,
    assignBulkPermissions,
    findByRoles,
    updatePermission
} = require('../../controllers/admin/permissionsController');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management APIs
 */

/**
 * @swagger
 * /api/admin/permissions/modules:
 *   get:
 *     summary: Get all modules with submodules and actions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modules fetched successfully
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
 *                   example: "Modules fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                         example: "dashboard"
 *                       actions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["create", "view", "update", "delete"]
 *                       submodules:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             actions:
 *                               type: array
 *                               items:
 *                                 type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/permissions/modules', authMiddleware, getModules);

/**
 * @swagger
 * /api/admin/permissions/bulk:
 *   post:
 *     summary: Assign bulk permissions to a role
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *               - permissions
 *             properties:
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                       example: "dashboard"
 *                     submodule:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["create", "view"]
 *                     status:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
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
 *                   example: "Permissions assigned successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         example: "created"
 *                       permission:
 *                         type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/permissions/bulk', authMiddleware, assignBulkPermissions);

/**
 * @swagger
 * /api/admin/permissions/roles:
 *   get:
 *     summary: Get permissions by role IDs
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated role IDs (e.g., "1,2,3")
 *         example: "1,2"
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
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
 *                   example: "Permissions fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       role_id:
 *                         type: integer
 *                       module:
 *                         type: string
 *                       submodule:
 *                         type: string
 *                         nullable: true
 *                       can_create:
 *                         type: boolean
 *                       can_view:
 *                         type: boolean
 *                       can_update:
 *                         type: boolean
 *                       can_delete:
 *                         type: boolean
 *                       status:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/permissions/roles', authMiddleware, findByRoles);

/**
 * @swagger
 * /api/admin/permissions/{id}:
 *   put:
 *     summary: Update a specific permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["view", "update"]
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Permission updated successfully
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
 *                   example: "Permission updated successfully"
 *       400:
 *         description: Invalid permission ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */
router.put('/permissions/:id', authMiddleware, updatePermission);

module.exports = router;
