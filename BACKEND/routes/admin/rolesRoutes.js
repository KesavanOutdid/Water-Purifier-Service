const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const { cacheMiddleware } = require('../../middleware/cache');
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
} = require('../../controllers/admin/rolesController');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management APIs
 */

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Roles]
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
 *         description: Roles fetched successfully
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
 *                       role_id:
 *                         type: integer
 *                         example: 1
 *                       role_name:
 *                         type: string
 *                         example: "Admin"
 *                       created_by:
 *                         type: string
 *                         format: email
 *                         example: "admin@example.com"
 *                         description: Email ID of the user who created the role
 *                       created_time:
 *                         type: string
 *                         format: date-time
 *                       modified_by:
 *                         type: string
 *                         format: email
 *                         nullable: true
 *                         example: "modifier@example.com"
 *                         description: Email ID of the user who last modified the role
 *                       modified_at:
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
router.get('/roles', authMiddleware, pagination, cacheMiddleware('roles', 300), getRoles);

/**
 * @swagger
 * /api/admin/roles/{role_id}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role fetched successfully
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
 *                     role_id:
 *                       type: integer
 *                       example: 1
 *                     role_name:
 *                       type: string
 *                       example: "Admin"
 *                     created_by:
 *                       type: string
 *                       format: email
 *                       example: "admin@example.com"
 *                       description: Email ID of the user who created the role
 *                     created_time:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       format: email
 *                       nullable: true
 *                       example: "modifier@example.com"
 *                       description: Email ID of the user who last modified the role
 *                     modified_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.get('/roles/:role_id', authMiddleware, getRoleById);

/**
 * @swagger
 * /api/admin/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *               - created_by
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: "Manager"
 *               created_by:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user creating the role
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *                   example: "Role created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/roles', authMiddleware, createRole);

/**
 * @swagger
 * /api/admin/roles/{role_id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *               - modified_by
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: "Senior Manager"
 *               modified_by:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user modifying the role
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.put('/roles/:role_id', authMiddleware, updateRole);

/**
 * @swagger
 * /api/admin/roles/{role_id}:
 *   delete:
 *     summary: Delete a role (soft delete)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.delete('/roles/:role_id', authMiddleware, deleteRole);

module.exports = router;
