const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const { search } = require('../../controllers/admin/searchController');

/**
 * @swagger
 * tags:
 *   name: Admin-Search
 *   description: Universal search API for all entities
 */

/**
 * @swagger
 * /api/admin/search:
 *   get:
 *     summary: Search across multiple entity types (users, roles, models, devices, tasks, installations)
 *     tags: [Admin-Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, role, model, device, service, installation]
 *         description: Type of entity to search
 *         example: user
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *         example: john
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user_id. For service/installation filters by distributor_id/local_distributor_id. For user filters by distributor/local_distributor. For device filters by assigned_to/assigned_to_local. Admin users (role 1) see all results.
 *         example: USR001
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
 *         description: Search results
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
 *                   description: Array of results (format depends on type)
 *                   items:
 *                     oneOf:
 *                       - type: object
 *                         description: User result (full object without password)
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           roles:
 *                             type: array
 *                             items:
 *                               type: integer
 *                       - type: object
 *                         description: Role result
 *                         properties:
 *                           role_id:
 *                             type: integer
 *                           role_name:
 *                             type: string
 *                       - type: object
 *                         description: Model result
 *                         properties:
 *                           model_id:
 *                             type: string
 *                           model_name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       - type: object
 *                         description: Device result
 *                         properties:
 *                           device_id:
 *                             type: string
 *                           device_name:
 *                             type: string
 *                           model_id:
 *                             type: string
 *                           allotted:
 *                             type: boolean
 *                       - type: object
 *                         description: Task result
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                           customer_name:
 *                             type: string
 *                           model_name:
 *                             type: string
 *                           service_type:
 *                             type: integer
 *                           engineer_name:
 *                             type: string
 *                           task_status:
 *                             type: string
 *                       - type: object
 *                         description: Installation result
 *                         properties:
 *                           task_id:
 *                             type: integer
 *                           customer_name:
 *                             type: string
 *                           device_id:
 *                             type: string
 *                           model_name:
 *                             type: string
 *                           engineer_name:
 *                             type: string
 *                           completed_time:
 *                             type: string
 *                             format: date-time
 *                           address:
 *                             type: string
 *                 total_count:
 *                   type: integer
 *                   description: Total number of matching results
 *                   example: 25
 *                 status_counts:
 *                   type: object
 *                   description: Status counts (only for service/installation types)
 *                   example: {"created": 5, "assigned": 10, "completed": 8}
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/search', authMiddleware, pagination, search);

module.exports = router;
