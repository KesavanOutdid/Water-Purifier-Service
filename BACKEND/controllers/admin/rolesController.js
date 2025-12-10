const { getDB } = require('../../config/database');
const { getRedisClient } = require('../../config/redis');

const ROLES_CACHE_KEY = 'roles:all';
const CACHE_TTL = 3600;

const clearRolesCache = async () => {
    const redisClient = getRedisClient();
    if (redisClient) {
        await redisClient.del(ROLES_CACHE_KEY);
    }
};

const getRoles = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const db = getDB();

        const totalItems = await db.collection('roles').countDocuments({ status: true });
        req.paginationTotal = totalItems;

        const roles = await db.collection('roles')
            .find({ status: true })
            .sort({ role_id: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching roles',
            error: error.message
        });
    }
};

const createRole = async (req, res) => {
    try {
        const { role_name, created_by } = req.body;

        if (!role_name) {
            return res.status(400).json({
                success: false,
                message: 'role_name is required'
            });
        }

        if (!created_by) {
            return res.status(400).json({
                success: false,
                message: 'created_by is required'
            });
        }

        const db = getDB();
        
        const lastRole = await db.collection('roles')
            .find()
            .sort({ role_id: -1 })
            .limit(1)
            .toArray();
        
        const role_id = lastRole.length > 0 ? lastRole[0].role_id + 1 : 1;

        const newRole = {
            role_id,
            role_name,
            created_by,
            created_time: new Date(),
            modified_by: null,
            modified_at: null,
            status: true
        };

        const result = await db.collection('roles').insertOne(newRole);

        await clearRolesCache();

        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: { ...newRole, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating role',
            error: error.message
        });
    }
};

const updateRole = async (req, res) => {
    try {
        const { role_id } = req.params;
        const { role_name, modified_by } = req.body;

        if (!role_name) {
            return res.status(400).json({
                success: false,
                message: 'role_name is required'
            });
        }

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const updateData = {
            role_name,
            modified_by,
            modified_at: new Date()
        };

        const result = await db.collection('roles').updateOne(
            { role_id: parseInt(role_id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        await clearRolesCache();

        res.json({
            success: true,
            message: 'Role updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating role',
            error: error.message
        });
    }
};

const deleteRole = async (req, res) => {
    try {
        const { role_id } = req.params;

        const db = getDB();

        const result = await db.collection('roles').updateOne(
            { role_id: parseInt(role_id) },
            { $set: { status: false } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        await clearRolesCache();

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting role',
            error: error.message
        });
    }
};

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole
};
