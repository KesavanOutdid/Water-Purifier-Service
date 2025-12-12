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
    completeTask,
    getTaskHistory,
    getEngineerHistory
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
 *     summary: Get all tasks assigned to an engineer
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
 *         description: Engineer tasks fetched successfully
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
 *                         enum: [1, 2]
 *                       model_id:
 *                         type: string
 *                       model_name:
 *                         type: string
 *                       task_status:
 *                         type: string
 *                         enum: [created, assigned, accepted, rejected, in_progress, completed]
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineer/:engineer_id/tasks', authMiddleware, pagination, getTasksByEngineer);

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
 * /api/app/tasks/{task_id}/complete:
 *   post:
 *     summary: Mark task as completed with device allotment and photos (max 3)
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
 *               - device_id
 *             properties:
 *               engineer_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               device_id:
 *                 type: string
 *                 example: "DEV12345"
 *                 description: Device ID to allot to customer
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 3
 *                 description: Task completion photos (maximum 3 images)
 *     responses:
 *       200:
 *         description: Task completed successfully and device allotted to customer
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
 *         description: Validation error or invalid task status or more than 3 photos or device already allotted
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
 *     summary: Get engineer's complete task history
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/engineer/:engineer_id/history', authMiddleware, pagination, getEngineerHistory);

module.exports = router;
