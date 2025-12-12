const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { getDashboard } = require('../../controllers/admin/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and statistics APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics based on user role
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to determine role and access level
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully (response varies by role)
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
 *                   oneOf:
 *                     - title: Admin Dashboard
 *                       properties:
 *                         role:
 *                           type: string
 *                           example: admin
 *                         total_roles:
 *                           type: integer
 *                           description: Total unique roles in system
 *                         total_users:
 *                           type: integer
 *                         total_tasks:
 *                           type: integer
 *                         total_tasks_completed:
 *                           type: integer
 *                         today_tasks:
 *                           type: integer
 *                         week_tasks:
 *                           type: integer
 *                         month_tasks:
 *                           type: integer
 *                         year_tasks:
 *                           type: integer
 *                         users_by_role:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role:
 *                                 type: integer
 *                               count:
 *                                 type: integer
 *                         top_5_distributors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *                         top_5_local_distributors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *                         top_5_engineers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *                     - title: Distributor Dashboard
 *                       properties:
 *                         role:
 *                           type: string
 *                           example: distributor
 *                         roles_under:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [3, 4]
 *                         total_users_under:
 *                           type: integer
 *                         users_by_role_under:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               role:
 *                                 type: integer
 *                               count:
 *                                 type: integer
 *                         total_tasks_under:
 *                           type: integer
 *                         completed_tasks_under:
 *                           type: integer
 *                         today_tasks:
 *                           type: integer
 *                         week_tasks:
 *                           type: integer
 *                         month_tasks:
 *                           type: integer
 *                         year_tasks:
 *                           type: integer
 *                         top_5_local_distributors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *                         top_5_engineers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *                     - title: Local Distributor Dashboard
 *                       properties:
 *                         role:
 *                           type: string
 *                           example: local_distributor
 *                         roles_under:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [4]
 *                         total_users_under:
 *                           type: integer
 *                         total_tasks_under:
 *                           type: integer
 *                         completed_tasks_under:
 *                           type: integer
 *                         today_tasks:
 *                           type: integer
 *                         week_tasks:
 *                           type: integer
 *                         month_tasks:
 *                           type: integer
 *                         year_tasks:
 *                           type: integer
 *                         top_5_engineers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               total_tasks:
 *                                 type: integer
 *                               completed_tasks:
 *                                 type: integer
 *       400:
 *         description: Missing user_id parameter
 *       403:
 *         description: Insufficient permissions for dashboard access
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authMiddleware, getDashboard);

module.exports = router;
