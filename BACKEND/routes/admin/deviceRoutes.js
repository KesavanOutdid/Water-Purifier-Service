const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const { cacheMiddleware } = require('../../middleware/cache');
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
    reassignDevice
} = require('../../controllers/admin/deviceAssignmentController');
const { getDevicesForServices } = require('../../controllers/admin/taskController');

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
 *                         format: email
 *                         example: "admin@example.com"
 *                         description: Email ID of the user who created the device
 *                       created_time:
 *                         type: string
 *                         format: date-time
 *                       modified_by:
 *                         type: string
 *                         format: email
 *                         nullable: true
 *                         example: "modifier@example.com"
 *                         description: Email ID of the user who last modified the device
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
router.get('/devices', authMiddleware, pagination, cacheMiddleware('devices', 300), getDevices);

/**
 * @swagger
 * /api/admin/devices/services:
 *   get:
 *     summary: Get all allotted devices for services filtered by user role
 *     description: Returns all devices where allotted is true and status is true, automatically filtered based on user role (admin gets all, distributor gets assigned_to, local_distributor gets assigned_to_local)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "6c69ff7e-7b88-41a1-930a-fa4c544680b0"
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
 *                 count:
 *                   type: integer
 *                   example: 25
 *       400:
 *         description: Missing user_id parameter
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/devices/services', authMiddleware, getDevicesForServices);

/**
 * @swagger
 * /api/admin/devices/{device_id}:
 *   get:
 *     summary: Get a device by ID (includes assignment history and service history)
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
 *         description: Device fetched successfully with assignment history and service history timeline
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
 *                     device_id:
 *                       type: string
 *                       example: "DEVICE001"
 *                     model_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     assigned_to:
 *                       type: string
 *                     assigned_to_local:
 *                       type: string
 *                     assignment_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Complete assignment history of the device
 *                     service_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           service_type:
 *                             type: string
 *                             enum: [Installation, Service]
 *                             example: "Installation"
 *                           task_id:
 *                             type: integer
 *                             example: 12345
 *                           task_status:
 *                             type: string
 *                             example: "completed"
 *                           engineer_name:
 *                             type: string
 *                             example: "John Engineer"
 *                             nullable: true
 *                           completed_time:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           parts_used:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Board", "lcd cable"]
 *                       description: Service history timeline sorted by completed_time (old to new) - only completed tasks
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
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user creating the device
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
 *                 format: email
 *                 example: "admin@example.com"
 *                 description: Email ID of the user modifying the device
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

module.exports = router;
