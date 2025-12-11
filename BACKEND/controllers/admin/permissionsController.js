const { getDB } = require('../../config/database');
const { ObjectId } = require('mongodb');
const MODULES = require('../../config/moduleConfig');

const getModules = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Modules fetched successfully',
            data: MODULES
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching modules',
            error: error.message
        });
    }
};

const assignBulkPermissions = async (req, res) => {
    try {
        const { role_id, permissions } = req.body;

        if (!role_id || !permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'role_id and permissions array are required'
            });
        }

        const db = getDB();
        const results = [];

        for (const permission of permissions) {
            const { module, submodule, actions } = permission;

            if (!module) continue;

            const permissionDoc = {
                role_id,
                module,
                submodule: submodule || null,
                can_create: actions?.includes('create') || false,
                can_view: actions?.includes('view') || false,
                can_update: actions?.includes('update') || false,
                can_delete: actions?.includes('delete') || false,
                status: permission.status !== undefined ? permission.status : true,
                updated_at: new Date()
            };

            const query = { role_id, module };
            if (submodule) {
                query.submodule = submodule;
            }

            const existing = await db.collection('permissions').findOne(query);

            if (existing) {
                await db.collection('permissions').updateOne(query, { $set: permissionDoc });
                results.push({ action: 'updated', permission: permissionDoc });
            } else {
                permissionDoc.created_at = new Date();
                await db.collection('permissions').insertOne(permissionDoc);
                results.push({ action: 'created', permission: permissionDoc });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Permissions assigned successfully',
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning permissions',
            error: error.message
        });
    }
};

const findByRoles = async (req, res) => {
    try {
        const roleIds = req.query.ids ? req.query.ids.split(',').map(Number) : [];

        if (!roleIds.length) {
            return res.status(400).json({
                success: false,
                message: 'roleIds required'
            });
        }

        const db = getDB();

        const query = { role_id: { $in: roleIds } };

        const permissions = await db.collection('permissions')
            .find(query)
            .toArray();

        res.json({
            success: true,
            message: 'Permissions fetched successfully',
            data: permissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions',
            error: error.message
        });
    }
};

const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { actions, status } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const db = getDB();

        const updateData = {
            updated_at: new Date()
        };

        if (actions) {
            updateData.can_create = actions.includes('create');
            updateData.can_view = actions.includes('view');
            updateData.can_update = actions.includes('update');
            updateData.can_delete = actions.includes('delete');
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        const result = await db.collection('permissions').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        res.json({
            success: true,
            message: 'Permission updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating permission',
            error: error.message
        });
    }
};

module.exports = {
    getModules,
    assignBulkPermissions,
    findByRoles,
    updatePermission
};
