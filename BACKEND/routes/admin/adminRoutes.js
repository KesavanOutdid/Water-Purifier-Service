const express = require('express');
const router = express.Router();
const rolesRoutes = require('./rolesRoutes');
const adminProfileRoutes = require('./adminProfileRoutes');
const permissionsRoutes = require('./permissionsRoutes');
const usersRoutes = require('./usersRoutes');

router.use('/', rolesRoutes);
router.use('/', adminProfileRoutes);
router.use('/', permissionsRoutes);
router.use('/', usersRoutes);

module.exports = router;
