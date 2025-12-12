const { getDB } = require('../../config/database');

const getDevices = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const { assignee_id, level } = req.query;
        const db = getDB();

        let query = { status: true };
        let sortField = { created_time: -1 };

        if (assignee_id && level) {
            if (!['distributor', 'local_distributor'].includes(level)) {
                return res.status(400).json({
                    success: false,
                    message: 'level must be either "distributor" or "local_distributor"'
                });
            }

            if (level === 'distributor') {
                query.assigned_to = assignee_id;
            } else if (level === 'local_distributor') {
                query.assigned_to_local = assignee_id;
            }
        }

        const totalItems = await db.collection('devices').countDocuments(query);
        req.paginationTotal = totalItems;

        const devices = await db.collection('devices')
            .find(query)
            .sort(sortField)
            .skip(skip)
            .limit(limit)
            .toArray();

        const allDevicesCount = await db.collection('devices').countDocuments({ status: true });
        
        res.json({
            success: true,
            data: devices,
            total_count: allDevicesCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching devices',
            error: error.message
        });
    }
};

const getDeviceById = async (req, res) => {
    try {
        const { device_id } = req.params;
        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id, 
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        const responseData = {
            ...device,
            assignment_history: device.assignment_history || []
        };

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching device',
            error: error.message
        });
    }
};

const createDevice = async (req, res) => {
    try {
        const { device_id, model_id, created_by } = req.body;

        if (!device_id) {
            return res.status(400).json({
                success: false,
                message: 'device_id is required'
            });
        }

        if (!model_id) {
            return res.status(400).json({
                success: false,
                message: 'model_id is required'
            });
        }

        if (!created_by) {
            return res.status(400).json({
                success: false,
                message: 'created_by is required'
            });
        }

        const db = getDB();

        const existingDevice = await db.collection('devices').findOne({ 
            device_id: device_id.toString()
        });

        if (existingDevice) {
            return res.status(400).json({
                success: false,
                message: 'Device ID already exists'
            });
        }
        
        const control = await db.collection('models').findOne({ 
            uid: model_id, 
            status: true 
        });

        if (!control) {
            return res.status(404).json({
                success: false,
                message: 'Control model not found'
            });
        }

        if (control.quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Control model is out of stock'
            });
        }

        const newDevice = {
            device_id: device_id.toString(),
            model_id,
            name: control.name,
            created_by,
            created_time: new Date(),
            modified_by: null,
            modified_time: null,
            status: true
        };

        const result = await db.collection('devices').insertOne(newDevice);

        await db.collection('models').updateOne(
            { uid: model_id },
            { $inc: { quantity: -1 } }
        );

        res.status(201).json({
            success: true,
            message: 'Device created successfully',
            data: { ...newDevice, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating device',
            error: error.message
        });
    }
};

const updateDevice = async (req, res) => {
    try {
        const { device_id } = req.params;
        const { status, modified_by } = req.body;

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        const updateData = {
            modified_by,
            modified_time: new Date()
        };

        if (status !== undefined && status !== null) {
            updateData.status = status;
        }

        await db.collection('devices').updateOne(
            { device_id: device_id },
            { $set: updateData }
        );

        res.json({
            success: true,
            message: 'Device updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating device',
            error: error.message
        });
    }
};

const deleteDevice = async (req, res) => {
    try {
        const { device_id } = req.params;

        const db = getDB();

        const result = await db.collection('devices').updateOne(
            { device_id: device_id, status: true },
            { $set: { status: false } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.json({
            success: true,
            message: 'Device deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting device',
            error: error.message
        });
    }
};

module.exports = {
    getDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice
};
