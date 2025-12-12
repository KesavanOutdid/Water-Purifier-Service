const { getDB } = require('../../config/database');

const getTasksByEngineer = async (req, res) => {
    try {
        const { engineer_id } = req.params;
        const { page, limit, skip } = req.pagination;
        const db = getDB();

        const query = { 
            assigned_to: engineer_id,
            status: true 
        };

        const totalItems = await db.collection('tasks').countDocuments(query);
        req.paginationTotal = totalItems;

        const tasks = await db.collection('tasks')
            .find(query)
            .sort({ assigned_time: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching engineer tasks',
            error: error.message
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { task_id } = req.params;
        const db = getDB();

        const task = await db.collection('tasks').findOne({ 
            task_id: parseInt(task_id), 
            status: true 
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message
        });
    }
};

const acceptTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { engineer_id } = req.body;

        if (!engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'engineer_id is required'
            });
        }

        const db = getDB();

        const task = await db.collection('tasks').findOne({ 
            task_id: parseInt(task_id), 
            status: true 
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (task.assigned_to !== engineer_id) {
            return res.status(403).json({
                success: false,
                message: 'This task is not assigned to you'
            });
        }

        if (task.task_status === 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Task is already accepted'
            });
        }

        if (task.task_status !== 'assigned') {
            return res.status(400).json({
                success: false,
                message: 'Task cannot be accepted in current status'
            });
        }

        const historyRecord = {
            action: 'accept',
            engineer_id: engineer_id,
            engineer_name: task.engineer_name,
            timestamp: new Date(),
            reason: null
        };

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    task_status: 'accepted',
                    modified_by: engineer_id,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        res.json({
            success: true,
            message: 'Task accepted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error accepting task',
            error: error.message
        });
    }
};

const rejectTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { engineer_id, reason } = req.body;

        if (!engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'engineer_id is required'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'reason is required'
            });
        }

        const db = getDB();

        const task = await db.collection('tasks').findOne({ 
            task_id: parseInt(task_id), 
            status: true 
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (task.assigned_to !== engineer_id) {
            return res.status(403).json({
                success: false,
                message: 'This task is not assigned to you'
            });
        }

        if (task.task_status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Task is already rejected'
            });
        }

        if (task.task_status !== 'assigned') {
            return res.status(400).json({
                success: false,
                message: 'Task cannot be rejected in current status'
            });
        }

        const historyRecord = {
            action: 'reject',
            engineer_id: engineer_id,
            engineer_name: task.engineer_name,
            timestamp: new Date(),
            reason: reason
        };

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    task_status: 'rejected',
                    rejection_reason: reason,
                    modified_by: engineer_id,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        res.json({
            success: true,
            message: 'Task rejected successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting task',
            error: error.message
        });
    }
};

const completeTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { engineer_id, device_id } = req.body;

        if (!engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'engineer_id is required'
            });
        }

        if (!device_id) {
            return res.status(400).json({
                success: false,
                message: 'device_id is required'
            });
        }

        const db = getDB();

        const task = await db.collection('tasks').findOne({ 
            task_id: parseInt(task_id), 
            status: true 
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (task.assigned_to !== engineer_id) {
            return res.status(403).json({
                success: false,
                message: 'This task is not assigned to you'
            });
        }

        if (task.task_status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Task is already completed'
            });
        }

        if (task.task_status !== 'in_progress' && task.task_status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Task must be accepted or in progress to be completed'
            });
        }

        const device = await db.collection('devices').findOne({ 
            device_id: device_id.toString(),
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        if (device.allotted === true) {
            return res.status(400).json({
                success: false,
                message: 'Device is already allotted to another customer'
            });
        }

        if (device.model_id !== task.model_id) {
            return res.status(400).json({
                success: false,
                message: 'Device model does not match task model'
            });
        }

        if (device.assigned_to !== task.distributor_id) {
            return res.status(400).json({
                success: false,
                message: 'Device distributor does not match task distributor'
            });
        }

        if (device.assigned_to_local !== task.local_distributor_id) {
            return res.status(400).json({
                success: false,
                message: 'Device local distributor does not match task local distributor'
            });
        }

        const photos = [];
        if (req.files && req.files.length > 0) {
            if (req.files.length > 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 3 photos are allowed'
                });
            }
            req.files.forEach(file => {
                photos.push(file.filename);
            });
        }

        await db.collection('devices').updateOne(
            { device_id: device_id.toString() },
            { 
                $set: {
                    allotted: true,
                    customer_name: task.customer_name,
                    customer_phone: task.phone,
                    customer_email: task.email,
                    customer_address: task.address,
                    allotted_by: engineer_id,
                    allotted_time: new Date(),
                    task_id: task.task_id
                }
            }
        );

        const historyRecord = {
            action: 'complete',
            engineer_id: engineer_id,
            engineer_name: task.engineer_name,
            timestamp: new Date(),
            reason: null
        };

        const updateData = {
            task_status: 'completed',
            completed_time: new Date(),
            device_id: device_id.toString(),
            device_name: device.name,
            device_model_id: device.model_id,
            modified_by: engineer_id,
            modified_time: new Date()
        };

        if (photos.length > 0) {
            updateData.completion_photos = photos;
        }

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: updateData,
                $push: { task_history: historyRecord }
            }
        );

        res.json({
            success: true,
            message: 'Task completed successfully',
            data: {
                photos: photos,
                device: {
                    device_id: device_id,
                    device_name: device.name,
                    model_id: device.model_id
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error completing task',
            error: error.message
        });
    }
};

const getTaskHistory = async (req, res) => {
    try {
        const { task_id } = req.params;
        const db = getDB();

        const task = await db.collection('tasks').findOne({ 
            task_id: parseInt(task_id), 
            status: true 
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: {
                task_id: task.task_id,
                customer_name: task.customer_name,
                service_type: task.service_type,
                current_status: task.task_status,
                current_engineer: {
                    engineer_id: task.assigned_to,
                    engineer_name: task.engineer_name
                },
                history: task.task_history || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching task history',
            error: error.message
        });
    }
};

const getEngineerHistory = async (req, res) => {
    try {
        const { engineer_id } = req.params;
        const { page, limit, skip } = req.pagination;
        const db = getDB();

        const query = {
            'task_history.engineer_id': engineer_id,
            status: true
        };

        const totalItems = await db.collection('tasks').countDocuments(query);
        req.paginationTotal = totalItems;

        const tasks = await db.collection('tasks')
            .find(query)
            .sort({ modified_time: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const historyData = tasks.map(task => {
            const engineerActions = task.task_history.filter(
                h => h.engineer_id === engineer_id || h.to === engineer_id || h.from === engineer_id
            );
            
            return {
                task_id: task.task_id,
                customer_name: task.customer_name,
                service_type: task.service_type,
                current_status: task.task_status,
                actions: engineerActions
            };
        });

        res.json({
            success: true,
            data: historyData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching engineer history',
            error: error.message
        });
    }
};

module.exports = {
    getTasksByEngineer,
    getTaskById,
    acceptTask,
    rejectTask,
    completeTask,
    getTaskHistory,
    getEngineerHistory
};
