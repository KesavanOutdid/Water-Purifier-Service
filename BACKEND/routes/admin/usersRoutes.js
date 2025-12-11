const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const pagination = require('../../middleware/pagination');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../../controllers/admin/usersController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination (optionally filter by distributor/local_distributor)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter users where this user_id matches distributor or local_distributor
 *         required: false
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
 *         description: Users fetched successfully
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
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       number:
 *                         type: string
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       role_names:
 *                         type: array
 *                         items:
 *                           type: string
 *                       address:
 *                         type: object
 *                         properties:
 *                           doorno:
 *                             type: string
 *                           street:
 *                             type: string
 *                           city:
 *                             type: string
 *                           district:
 *                             type: string
 *                           state:
 *                             type: string
 *                           country:
 *                             type: string
 *                           pincode:
 *                             type: string
 *                       distributor:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       distributor_name:
 *                         type: string
 *                         nullable: true
 *                         example: "John Distributor"
 *                       local_distributor:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       local_distributor_name:
 *                         type: string
 *                         nullable: true
 *                         example: "Jane Local Distributor"
 *                       created_by:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       modified_by:
 *                         type: string
 *                         nullable: true
 *                       modified_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       status:
 *                         type: boolean
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
router.get('/users', authMiddleware, pagination, getUsers);

/**
 * @swagger
 * /api/admin/users/{user_id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
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
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     number:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     role_names:
 *                       type: array
 *                       items:
 *                         type: string
 *                     address:
 *                       type: object
 *                       properties:
 *                         doorno:
 *                           type: string
 *                         street:
 *                           type: string
 *                         city:
 *                           type: string
 *                         district:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                     distributor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Distributor"
 *                     local_distributor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     local_distributor_name:
 *                       type: string
 *                       nullable: true
 *                       example: "Jane Local Distributor"
 *                     created_by:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     modified_by:
 *                       type: string
 *                       nullable: true
 *                     modified_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     status:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:user_id', authMiddleware, getUserById);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - roles
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               number:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               address:
 *                 type: object
 *                 properties:
 *                   doorno:
 *                     type: string
 *                     example: "123"
 *                   street:
 *                     type: string
 *                     example: "Main Street"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   district:
 *                     type: string
 *                     example: "Manhattan"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   pincode:
 *                     type: string
 *                     example: "10001"
 *               distributor:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               local_distributor:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               created_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: "User created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/users', authMiddleware, createUser);

/**
 * @swagger
 * /api/admin/users/{user_id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modified_by
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe Updated"
 *               number:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               address:
 *                 type: object
 *                 properties:
 *                   doorno:
 *                     type: string
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   pincode:
 *                     type: string
 *               distributor:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               local_distributor:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               status:
 *                 type: boolean
 *                 example: true
 *               modified_by:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/users/:user_id', authMiddleware, updateUser);

/**
 * @swagger
 * /api/admin/users/{user_id}:
 *   delete:
 *     summary: Delete a user (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:user_id', authMiddleware, deleteUser);

module.exports = router;
