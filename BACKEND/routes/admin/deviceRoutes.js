const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice
} = require('../../controllers/admin/deviceController');
const {
    assignDevice,
    unassignDevice,
    reassignDevice,
    getAssignmentHistory
} = require('../../controllers/admin/deviceAssignmentController');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management APIs
 */

/**
 * @swagger
 * /api/admin/devices:
 *   get:
 *     summary: Get all devices with pagination
 *     tags: [Devices]
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
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assignee ID (distributor or local distributor) - optional
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [distributor, local_distributor]
 *         description: Level of assignment (required if assignee_id is provided) - optional
 *     responses:
 *       200:
 *         description: Devices fetched successfully
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
 *                       device_id:
 *                         type: string
 *                         example: "DEVICE001"
 *                       model_id:
 *                         type: string
 *                         format: uuid
 *                         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                       name:
 *                         type: string
 *                         example: "Control Panel A"
 *                       assigned_to:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                       distributor_name:
 *                         type: string
 *                         nullable: true
 *                         example: "John Distributor"
 *                       assigned_to_local:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         example: "7fb95f64-8827-9673-d4gc-3d074g77bgb7"
 *                       local_distributor_name:
 *                         type: string
 *                         nullable: true
 *                         example: "Jane Local Distributor"
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
router.get('/devices', authMiddleware, pagination, getDevices);

/**
 * @swagger
 * /api/admin/devices/{device_id}:
 *   get:
 *     summary: Get a device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/devices/:device_id', authMiddleware, getDeviceById);

/**
 * @swagger
 * /api/admin/devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - model_id
 *               - created_by
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: "DEVICE001"
 *                 description: Unique device ID (string)
 *               model_id:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 description: Control model UID
 *               created_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: Device created successfully
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
 *                   example: "Device created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/devices', authMiddleware, createDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}:
 *   put:
 *     summary: Update a device (Note - device_id, model_id, and name cannot be updated)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modified_by
 *             properties:
 *               status:
 *                 type: boolean
 *                 example: true
 *                 description: Device status (optional)
 *               modified_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.put('/devices/:device_id', authMiddleware, updateDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}:
 *   delete:
 *     summary: Delete a device (soft delete)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.delete('/devices/:device_id', authMiddleware, deleteDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}/assign:
 *   post:
 *     summary: Assign device to distributor or local distributor
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigned_by
 *               - level
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [distributor, local_distributor]
 *                 example: "distributor"
 *                 description: Assignment level
 *               distributor_id:
 *                 type: string
 *                 example: "dist123"
 *                 description: Required when level is "distributor"
 *               local_distributor_id:
 *                 type: string
 *                 example: "local_dist456"
 *                 description: Required when level is "local_distributor"
 *               assigned_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Device assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.post('/devices/:device_id/assign', authMiddleware, assignDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}/unassign:
 *   post:
 *     summary: Unassign device from distributor or local distributor
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigned_by
 *               - level
 *             properties:
 *               assigned_by:
 *                 type: string
 *                 example: "admin@example.com"
 *               level:
 *                 type: string
 *                 enum: [distributor, local_distributor]
 *                 example: "distributor"
 *     responses:
 *       200:
 *         description: Device unassigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.post('/devices/:device_id/unassign', authMiddleware, unassignDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}/reassign:
 *   post:
 *     summary: Reassign device to a new distributor or local distributor
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigned_by
 *               - level
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [distributor, local_distributor]
 *                 example: "distributor"
 *                 description: Reassignment level
 *               new_distributor_id:
 *                 type: string
 *                 example: "dist789"
 *                 description: Required when level is "distributor"
 *               new_local_distributor_id:
 *                 type: string
 *                 example: "local_dist999"
 *                 description: Required when level is "local_distributor"
 *               assigned_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Device reassigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.post('/devices/:device_id/reassign', authMiddleware, reassignDevice);

/**
 * @swagger
 * /api/admin/devices/{device_id}/assignment-history:
 *   get:
 *     summary: Get device assignment history
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Assignment history fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.get('/devices/:device_id/assignment-history', authMiddleware, getAssignmentHistory);

module.exports = router;
