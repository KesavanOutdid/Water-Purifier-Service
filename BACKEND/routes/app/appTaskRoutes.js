const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const { uploadTaskPhotos } = require('../../middleware/uploadMiddleware');
const {
    getTasksByEngineer,
    getTaskById,
    acceptTask,
    rejectTask,
    waitTask,
    completeTask,
    getTaskHistory,
    getEngineerHistory,
    getDashboardStats,
    configureDevice
} = require('../../controllers/app/appTaskController');

/**
 * @swagger
 * tags:
 *   name: App-Tasks
 *   description: Task management APIs for engineers (App)
 */

/**
 * @swagger
 * /api/app/engineer/{engineer_id}/tasks:
 *   get:
 *     summary: Get all tasks grouped by status for an engineer (ASSIGNED, ACCEPTED, COMPLETED, REJECTED)
 *     tags: [App-Tasks]
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
 *     responses:
 *       200:
 *         description: Engineer tasks fetched successfully grouped by status
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
 *                     assigned:
 *                       type: array
 *                       description: Tasks with status 'assigned'
 *                       items:
 *                         type: object
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                             example: 12345
 *                           customer_name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                           service_type:
 *                             type: integer
 *                             enum: [1, 2]
 *                           model_id:
 *                             type: string
 *                           model_name:
 *                             type: string
 *                           task_status:
 *                             type: string
 *                             example: assigned
 *                     accepted:
 *                       type: array
 *                       description: Tasks with status 'accepted' or 'in_progress'
 *                       items:
 *                         type: object
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                           customer_name:
 *                             type: string
 *                           task_status:
 *                             type: string
 *                             enum: [accepted, in_progress]
 *                     completed:
 *                       type: array
 *                       description: Tasks with status 'completed'
 *                       items:
 *                         type: object
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                           customer_name:
 *                             type: string
 *                           task_status:
 *                             type: string
 *                             example: completed
 *                           device_id:
 *                             type: string
 *                           completion_photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                     rejected:
 *                       type: array
 *                       description: Tasks rejected by this engineer (only shows tasks rejected by this specific engineer)
 *                       items:
 *                         type: object
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                           customer_name:
 *                             type: string
 *                           task_status:
 *                             type: string
 *                             example: rejected
 *                           rejection_reason:
 *                             type: string
 *                             description: Reason provided by engineer for rejection
 *                           task_history:
 *                             type: array
 *                             description: Complete task history including rejection details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineer/:engineer_id/tasks', authMiddleware, getTasksByEngineer);

/**
 * @swagger
 * /api/app/tasks/{task_id}:
 *   get:
 *     summary: Get task by ID with complete details
 *     tags: [App-Tasks]
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
 *                     local_distributor_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     local_distributor_name:
 *                       type: string
 *                       nullable: true
 *                     assigned_to:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     engineer_name:
 *                       type: string
 *                       nullable: true
 *                     task_status:
 *                       type: string
 *                       enum: [created, assigned, accepted, rejected, in_progress, completed]
 *                     task_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           engineer_id:
 *                             type: string
 *                           engineer_name:
 *                             type: string
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
router.get('/tasks/:task_id', authMiddleware, getTaskById);

/**
 * @swagger
 * /api/app/tasks/{task_id}/accept:
 *   post:
 *     summary: Accept an assigned task
 *     tags: [App-Tasks]
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
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: Task accepted successfully
 *       400:
 *         description: Validation error or invalid task status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Task not assigned to this engineer
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/accept', authMiddleware, acceptTask);

/**
 * @swagger
 * /api/app/tasks/{task_id}/reject:
 *   post:
 *     summary: Reject an assigned task with reason
 *     tags: [App-Tasks]
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
 *               - reason
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               reason:
 *                 type: string
 *                 example: "Not available at that location"
 *                 description: Reason for rejecting the task
 *     responses:
 *       200:
 *         description: Task rejected successfully
 *       400:
 *         description: Validation error or invalid task status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Task not assigned to this engineer
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/reject', authMiddleware, rejectTask);

/**
 * @swagger
 * /api/app/tasks/{task_id}/wait:
 *   post:
 *     summary: Mark task as waiting with reason
 *     tags: [App-Tasks]
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
 *               - reason
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               reason:
 *                 type: string
 *                 example: "Waiting for customer confirmation"
 *                 description: Reason for marking task as waiting
 *     responses:
 *       200:
 *         description: Task marked as waiting successfully
 *       400:
 *         description: Validation error or invalid task status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Task not assigned to this engineer
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/wait', authMiddleware, waitTask);

/**
 * @swagger
 * /api/app/tasks/{task_id}/complete:
 *   post:
 *     summary: Mark task as completed with device allotment and photos (max 3) - MAC ID must be configured first
 *     tags: [App-Tasks]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - engineer_id
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               device_id:
 *                 type: string
 *                 example: "DEV12345"
 *                 description: Device ID from devices collection (REQUIRED ONLY for installation tasks - service_type 1. NOT required for service tasks with external devices)
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 3
 *                 description: Task completion photos (maximum 3 images)
 *     responses:
 *       200:
 *         description: Task completed successfully. For installation - device allotted to customer. For service - task marked complete
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
 *                   example: "Task completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["12345_1702345678901.jpg", "12345_1702345678902.jpg"]
 *                     device:
 *                       type: object
 *                       properties:
 *                         device_id:
 *                           type: string
 *                           example: "DEV12345"
 *                         device_name:
 *                           type: string
 *                           example: "CONTROL A"
 *                         model_id:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Validation error or invalid task status or more than 3 photos or device already allotted or MAC ID not configured
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Task not assigned to this engineer
 *       404:
 *         description: Task not found or Device not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/complete', authMiddleware, uploadTaskPhotos.array('photos', 3), completeTask);

/**
 * @swagger
 * /api/app/tasks/{task_id}/history:
 *   get:
 *     summary: Get task history
 *     tags: [App-Tasks]
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
 * /api/app/engineer/{engineer_id}/history:
 *   get:
 *     summary: Get all tasks grouped by status for an engineer (same format as /tasks endpoint)
 *     description: Returns all tasks grouped into assigned, accepted, completed, and rejected categories
 *     tags: [App-Tasks]
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
 *     responses:
 *       200:
 *         description: Engineer tasks fetched successfully grouped by status
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
 *                     assigned:
 *                       type: array
 *                       description: Tasks with status 'assigned'
 *                     accepted:
 *                       type: array
 *                       description: Tasks with status 'accepted' or 'in_progress'
 *                     completed:
 *                       type: array
 *                       description: Tasks with status 'completed'
 *                     rejected:
 *                       type: array
 *                       description: Tasks rejected by this engineer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineer/:engineer_id/history', authMiddleware, getEngineerHistory);

/**
 * @swagger
 * /api/app/engineer/{engineer_id}/dashboard:
 *   get:
 *     summary: Get engineer dashboard with task analytics
 *     description: |
 *       Returns task statistics with the following structure:
 *       - **current_day**: Hourly breakdown (0-23) for today
 *       - **current_week**: Daily breakdown (Sunday-Saturday) for current week
 *       - **current_year**: Monthly breakdown (January-December) for current year
 *       - **yearly**: Year-by-year totals for all years with data
 *       
 *       Add `?useMock=true` query parameter to get mock data instead of real data.
 *     tags: [App-Tasks]
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
 *         name: useMock
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Set to 'true' to use mock data (includes data for 2024 and 2025)
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
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
 *                     current_day:
 *                       type: object
 *                       properties:
 *                         date:
 *                           type: string
 *                           example: "2025-01-15"
 *                         hours:
 *                           type: object
 *                           description: Hours 0-23 with task counts
 *                           example: {"0": {"completed": 2, "accepted": 2, "rejected": 0}, "10": {"completed": 10, "accepted": 9, "rejected": 1}}
 *                         total:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: integer
 *                             accepted:
 *                               type: integer
 *                             rejected:
 *                               type: integer
 *                     current_week:
 *                       type: object
 *                       properties:
 *                         week_range:
 *                           type: string
 *                           example: "2025-01-12 to 2025-01-18"
 *                         days:
 *                           type: object
 *                           description: Days Sunday-Saturday with task counts
 *                           example: {"Sunday": {"completed": 34, "accepted": 32, "rejected": 2}, "Monday": {"completed": 41, "accepted": 38, "rejected": 3}}
 *                         total:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: integer
 *                             accepted:
 *                               type: integer
 *                             rejected:
 *                               type: integer
 *                     current_year:
 *                       type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *                           example: 2025
 *                         months:
 *                           type: object
 *                           description: Months January-December with task counts
 *                           example: {"January": {"completed": 620, "accepted": 590, "rejected": 30}, "February": {"completed": 580, "accepted": 553, "rejected": 27}}
 *                         total:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: integer
 *                             accepted:
 *                               type: integer
 *                             rejected:
 *                               type: integer
 *                     yearly:
 *                       type: object
 *                       description: Year-by-year totals
 *                       example: {"2024": {"completed": 8100, "accepted": 7750, "rejected": 350}, "2025": {"completed": 9010, "accepted": 8605, "rejected": 405}}
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineer/:engineer_id/dashboard', authMiddleware, getDashboardStats);

/**
 * @swagger
 * /api/app/tasks/{task_id}/configure:
 *   post:
 *     summary: Configure device MAC ID for task (save MAC ID before completing task)
 *     tags: [App-Tasks]
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
 *               - mac_id
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 description: Engineer user ID
 *               mac_id:
 *                 type: string
 *                 example: "AA:BB:CC:DD:EE:FF"
 *                 description: Device MAC Address
 *     responses:
 *       200:
 *         description: MAC ID configured successfully
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
 *                   example: "Device MAC ID configured successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_id:
 *                       type: integer
 *                       example: 12345
 *                     mac_id:
 *                       type: string
 *                       example: "AA:BB:CC:DD:EE:FF"
 *                     configured_time:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or MAC ID already set or task already completed or task not accepted/in_progress
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Task not assigned to this engineer
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/tasks/:task_id/configure', authMiddleware, configureDevice);

module.exports = router;
