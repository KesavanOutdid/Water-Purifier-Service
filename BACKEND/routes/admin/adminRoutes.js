const express = require('express');
const router = express.Router();
const rolesRoutes = require('./rolesRoutes');
const adminProfileRoutes = require('./adminProfileRoutes');
const permissionsRoutes = require('./permissionsRoutes');
const usersRoutes = require('./usersRoutes');
const controlRoutes = require('./controlRoutes');
const deviceRoutes = require('./deviceRoutes');
const taskRoutes = require('./taskRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const searchRoutes = require('./searchRoutes');
const partsRoutes = require('./partsRoutes');

router.use('/', rolesRoutes);
router.use('/', adminProfileRoutes);
router.use('/', permissionsRoutes);
router.use('/', usersRoutes);
router.use('/', controlRoutes);
router.use('/', deviceRoutes);
router.use('/', taskRoutes);
router.use('/', dashboardRoutes);
router.use('/', searchRoutes);
router.use('/', partsRoutes);

module.exports = router;
