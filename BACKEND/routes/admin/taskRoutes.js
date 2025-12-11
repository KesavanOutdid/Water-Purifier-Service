const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const {
    createTask,
    getTaskById,
    getServices,
    getInstallation,
    assignTask,
    reassignTask,
    getTaskHistory,
    getEngineerHistory
} = require('../../controllers/admin/taskController');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management APIs
 */

/**
 * @swagger
 * /api/admin/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - address
 *               - phone
 *               - email
 *               - service_type
 *               - model_id
 *               - created_by
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: "John Customer"
 *               address:
 *                 type: string
 *                 example: "123 Main Street, New York, NY 10001"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "customer@example.com"
 *               service_type:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 2
 *                 description: Type of service - 1 for installation, 2 for services
 *               model_id:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 description: Control model UID
 *               distributor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 description: Distributor user ID (optional)
 *               local_distributor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "7fb95f64-8827-9673-d4gc-3d074g77bgb7"
 *                 description: Local distributor user ID (optional)
 *               created_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                   example: "Task created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_id:
 *                       type: integer
 *                       example: 12345
 *                       description: 5-digit unique random task ID
 *                     customer_name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     service_type:
 *                       type: integer
 *                       enum: [1, 2]
 *                     model_id:
 *                       type: string
 *                       format: uuid
 *                     model_name:
 *                       type: string
 *                     distributor_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Distributor"
 *                     local_distributor_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     local_distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "Jane Local Distributor"
 *                     assigned_to:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: Engineer user ID
 *                     engineer_name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Engineer"
 *                     assigned_by:
 *                       type: string
 *                       nullable: true
 *                     assigned_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     created_by:
 *                       type: string
 *                     created_time:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       nullable: true
 *                     modified_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *                     task_status:
 *                       type: string
 *                       enum: [created, assigned, accepted, rejected, in_progress, completed]
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.post('/tasks', authMiddleware, createTask);

/**
 * @swagger
 * /api/admin/tasks/{task_id}:
 *   get:
 *     summary: Get a task by task ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 5-digit Task ID
 *         example: 12345
 *     responses:
 *       200:
 *         description: Task fetched successfully
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
 *                     task_id:
 *                       type: integer
 *                       example: 12345
 *                     customer_name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     service_type:
 *                       type: integer
 *                       enum: [1, 2]
 *                     model_id:
 *                       type: string
 *                       format: uuid
 *                     model_name:
 *                       type: string
 *                     distributor_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Distributor"
 *                     local_distributor_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     local_distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "Jane Local Distributor"
 *                     assigned_to:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: Engineer user ID
 *                     engineer_name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Engineer"
 *                     assigned_by:
 *                       type: string
 *                       nullable: true
 *                     assigned_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     created_by:
 *                       type: string
 *                     created_time:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       nullable: true
 *                     modified_time:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *                     task_status:
 *                       type: string
 *                       enum: [created, assigned, accepted, rejected, in_progress, completed]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/tasks/:task_id', authMiddleware, getTaskById);

/**
 * @swagger
 * /api/admin/tasks/services:
 *   get:
 *     summary: Get all service tasks with pagination
 *     tags: [Tasks]
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
 *         name: distributor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by distributor ID (optional)
 *       - in: query
 *         name: local_distributor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by local distributor ID (optional)
 *     responses:
 *       200:
 *         description: Service tasks fetched successfully
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
 *                       task_id:
 *                         type: integer
 *                         example: 12345
 *                       customer_name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       service_type:
 *                         type: integer
 *                         example: 2
 *                       model_id:
 *                         type: string
 *                         format: uuid
 *                       model_name:
 *                         type: string
 *                       assigned_to:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         description: Engineer user ID
 *                       engineer_name:
 *                         type: string
 *                         nullable: true
 *                         example: "John Engineer"
 *                       task_status:
 *                         type: string
 *                         enum: [created, assigned, accepted, rejected, in_progress, completed]
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
router.get('/tasks/services', authMiddleware, pagination, getServices);

/**
 * @swagger
 * /api/admin/tasks/installation:
 *   get:
 *     summary: Get all installation tasks with pagination
 *     tags: [Tasks]
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
 *         name: distributor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by distributor ID (optional)
 *       - in: query
 *         name: local_distributor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by local distributor ID (optional)
 *     responses:
 *       200:
 *         description: Installation tasks fetched successfully
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
 *                       task_id:
 *                         type: integer
 *                         example: 54321
 *                       customer_name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       service_type:
 *                         type: integer
 *                         example: 1
 *                       model_id:
 *                         type: string
 *                         format: uuid
 *                       model_name:
 *                         type: string
 *                       assigned_to:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         description: Engineer user ID
 *                       engineer_name:
 *                         type: string
 *                         nullable: true
 *                         example: "John Engineer"
 *                       task_status:
 *                         type: string
 *                         enum: [created, assigned, accepted, rejected, in_progress, completed]
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
router.get('/tasks/installation', authMiddleware, pagination, getInstallation);

/**
 * @swagger
 * /api/admin/tasks/{task_id}/assign:
 *   post:
 *     summary: Assign task to an engineer
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 5-digit Task ID
 *         example: 12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - engineer_id
 *               - assigned_by
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 description: Engineer user ID
 *               assigned_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Task assigned to engineer successfully
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
 *                   example: "Task assigned to engineer successfully"
 *       400:
 *         description: Validation error or task already assigned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or engineer not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/assign', authMiddleware, assignTask);

/**
 * @swagger
 * /api/admin/tasks/{task_id}/reassign:
 *   post:
 *     summary: Reassign task to a different engineer
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 5-digit Task ID
 *         example: 12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_engineer_id
 *               - assigned_by
 *             properties:
 *               new_engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "7fb95f64-8827-9673-d4gc-3d074g77bgb7"
 *                 description: New engineer user ID
 *               assigned_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Task reassigned to new engineer successfully
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
 *                   example: "Task reassigned to new engineer successfully"
 *       400:
 *         description: Validation error or task not assigned yet
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or new engineer not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/reassign', authMiddleware, reassignTask);

/**
 * @swagger
 * /api/admin/tasks/{task_id}/history:
 *   get:
 *     summary: Get task assignment history
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: task_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 5-digit Task ID
 *         example: 12345
 *     responses:
 *       200:
 *         description: Task history fetched successfully
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
 *                     task_id:
 *                       type: integer
 *                     customer_name:
 *                       type: string
 *                     service_type:
 *                       type: integer
 *                     current_status:
 *                       type: string
 *                     current_engineer:
 *                       type: object
 *                       properties:
 *                         engineer_id:
 *                           type: string
 *                         engineer_name:
 *                           type: string
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                             enum: [assign, reassign, accept, reject, complete]
 *                           from:
 *                             type: string
 *                             nullable: true
 *                           from_name:
 *                             type: string
 *                             nullable: true
 *                           to:
 *                             type: string
 *                             nullable: true
 *                           to_name:
 *                             type: string
 *                             nullable: true
 *                           engineer_id:
 *                             type: string
 *                             nullable: true
 *                           engineer_name:
 *                             type: string
 *                             nullable: true
 *                           assigned_by:
 *                             type: string
 *                             nullable: true
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           reason:
 *                             type: string
 *                             nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/tasks/:task_id/history', authMiddleware, getTaskHistory);

/**
 * @swagger
 * /api/admin/engineers/{engineer_id}/history:
 *   get:
 *     summary: Get all task history for an engineer
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: engineer_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Engineer user ID
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
 *         description: Engineer history fetched successfully
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
 *                       task_id:
 *                         type: integer
 *                       customer_name:
 *                         type: string
 *                       service_type:
 *                         type: integer
 *                       current_status:
 *                         type: string
 *                       actions:
 *                         type: array
 *                         items:
 *                           type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineers/:engineer_id/history', authMiddleware, pagination, getEngineerHistory);

module.exports = router;
