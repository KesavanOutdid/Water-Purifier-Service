const { getDB } = require('../../config/database');

const generateTaskId = async (db) => {
    let taskId;
    let isUnique = false;

    while (!isUnique) {
        taskId = Math.floor(10000 + Math.random() * 90000);
        const existing = await db.collection('tasks').findOne({ task_id: taskId });
        if (!existing) {
            isUnique = true;
        }
    }

    return taskId;
};

const createTask = async (req, res) => {
    try {
        const {
            customer_name,
            address,
            phone,
            email,
            service_type,
            model_id,
            distributor_id,
            local_distributor_id,
            created_by
        } = req.body;

        if (!customer_name) {
            return res.status(400).json({
                success: false,
                message: 'customer_name is required'
            });
        }

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'address is required'
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'phone is required'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'email is required'
            });
        }

        if (!service_type || ![1, 2].includes(service_type)) {
            return res.status(400).json({
                success: false,
                message: 'service_type is required and must be either 1 (installation) or 2 (services)'
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

        const model = await db.collection('models').findOne({ 
            uid: model_id, 
            status: true 
        });

        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found'
            });
        }

        let distributor_name = null;
        let local_distributor_name = null;

        if (distributor_id) {
            const distributor = await db.collection('users').findOne({ 
                user_id: distributor_id, 
                status: true 
            });
            if (!distributor) {
                return res.status(404).json({
                    success: false,
                    message: 'Distributor not found'
                });
            }
            distributor_name = distributor.name;
        }

        if (local_distributor_id) {
            const localDistributor = await db.collection('users').findOne({ 
                user_id: local_distributor_id, 
                status: true 
            });
            if (!localDistributor) {
                return res.status(404).json({
                    success: false,
                    message: 'Local distributor not found'
                });
            }
            local_distributor_name = localDistributor.name;
        }

        const task_id = await generateTaskId(db);

        const newTask = {
            task_id,
            customer_name,
            address: address ? {
                doorno: address.doorno || null,
                street: address.street || null,
                city: address.city || null,
                district: address.district || null,
                state: address.state || null,
                country: address.country || null,
                pincode: address.pincode || null
            } : null,
            phone,
            email,
            service_type,
            model_id,
            model_name: model.name,
            distributor_id: distributor_id || null,
            distributor_name: distributor_name,
            local_distributor_id: local_distributor_id || null,
            local_distributor_name: local_distributor_name,
            assigned_to: null,
            engineer_name: null,
            assigned_by: null,
            assigned_time: null,
            task_history: [],
            created_by,
            created_time: new Date(),
            modified_by: null,
            modified_time: null,
            status: true,
            task_status: 'created'
        };

        const result = await db.collection('tasks').insertOne(newTask);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { ...newTask, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating task',
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

        const responseData = { ...task };

        if (task.completion_photos && task.completion_photos.length > 0) {
            responseData.completion_photos_urls = task.completion_photos.map(
                photo => `/uploads/task-photos/${photo}`
            );
        }

        if (task.device_id) {
            responseData.collected_device = {
                device_id: task.device_id,
                device_name: task.device_name,
                device_model_id: task.device_model_id
            };
        }

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message
        });
    }
};

const getServices = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const { user_id } = req.query;
        const db = getDB();

        let query = { 
            status: true, 
            service_type: 2
        };

        if (user_id) {
            const requestingUser = await db.collection('users').findOne({ user_id });
           
            if (requestingUser && requestingUser.roles && requestingUser.roles.includes(1)) {
                query = { 
                    status: true, 
                    service_type: 2
                };
            } else {
                query = {
                    status: true,
                    service_type: 2,
                    $or: [
                        { distributor_id: user_id },
                        { local_distributor_id: user_id }
                    ]
                };
            }
        }

        const totalItems = await db.collection('tasks').countDocuments(query);
        req.paginationTotal = totalItems;

        const tasks = await db.collection('tasks')
            .find(query)
            .sort({ created_time: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const allServicesCount = await db.collection('tasks').countDocuments({ 
            status: true, 
            service_type: 2 
        });

        const statusCounts = await db.collection('tasks').aggregate([
            { $match: { status: true, service_type: 2 } },
            { $group: { _id: '$task_status', count: { $sum: 1 } } }
        ]).toArray();

        const statusSummary = {};
        statusCounts.forEach(item => {
            statusSummary[item._id] = item.count;
        });
        
        res.json({
            success: true,
            data: tasks,
            total_count: allServicesCount,
            status_counts: statusSummary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

const getInstallation = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const { user_id } = req.query;
        const db = getDB();

        let query = { 
            status: true, 
            service_type: 1
        };

        if (user_id) {
            const requestingUser = await db.collection('users').findOne({ user_id });
           
            if (requestingUser && requestingUser.roles && requestingUser.roles.includes(1)) {
                query = { 
                    status: true, 
                    service_type: 1
                };
            } else {
                query = {
                    status: true,
                    service_type: 1,
                    $or: [
                        { distributor_id: user_id },
                        { local_distributor_id: user_id }
                    ]
                };
            }
        }

        const totalItems = await db.collection('tasks').countDocuments(query);
        req.paginationTotal = totalItems;

        const tasks = await db.collection('tasks')
            .find(query)
            .sort({ created_time: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const allInstallationCount = await db.collection('tasks').countDocuments({ 
            status: true, 
            service_type: 1 
        });

        const statusCounts = await db.collection('tasks').aggregate([
            { $match: { status: true, service_type: 1 } },
            { $group: { _id: '$task_status', count: { $sum: 1 } } }
        ]).toArray();

        const statusSummary = {};
        statusCounts.forEach(item => {
            statusSummary[item._id] = item.count;
        });
        
        res.json({
            success: true,
            data: tasks,
            total_count: allInstallationCount,
            status_counts: statusSummary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching installation tasks',
            error: error.message
        });
    }
};

const assignTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { engineer_id, assigned_by } = req.body;

        if (!engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'engineer_id is required'
            });
        }

        if (!assigned_by) {
            return res.status(400).json({
                success: false,
                message: 'assigned_by is required'
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

        if (task.assigned_to) {
            return res.status(400).json({
                success: false,
                message: 'Task is already assigned to an engineer. Use reassign API instead.'
            });
        }

        const engineer = await db.collection('users').findOne({ 
            user_id: engineer_id, 
            status: true 
        });

        if (!engineer) {
            return res.status(404).json({
                success: false,
                message: 'Engineer not found'
            });
        }

        const historyRecord = {
            action: 'assign',
            from: null,
            from_name: null,
            to: engineer_id,
            to_name: engineer.name,
            assigned_by,
            timestamp: new Date(),
            reason: null
        };

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    assigned_to: engineer_id,
                    engineer_name: engineer.name,
                    assigned_by,
                    assigned_time: new Date(),
                    task_status: 'assigned',
                    modified_by: assigned_by,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        res.json({
            success: true,
            message: 'Task assigned to engineer successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning task',
            error: error.message
        });
    }
};

const reassignTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { new_engineer_id, assigned_by } = req.body;

        if (!new_engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'new_engineer_id is required'
            });
        }

        if (!assigned_by) {
            return res.status(400).json({
                success: false,
                message: 'assigned_by is required'
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

        if (!task.assigned_to) {
            return res.status(400).json({
                success: false,
                message: 'Task is not currently assigned to any engineer. Use assign API instead.'
            });
        }

        if (task.assigned_to === new_engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'Task is already assigned to this engineer'
            });
        }

        const newEngineer = await db.collection('users').findOne({ 
            user_id: new_engineer_id, 
            status: true 
        });

        if (!newEngineer) {
            return res.status(404).json({
                success: false,
                message: 'New engineer not found'
            });
        }

        const historyRecord = {
            action: 'reassign',
            from: task.assigned_to,
            from_name: task.engineer_name,
            to: new_engineer_id,
            to_name: newEngineer.name,
            assigned_by,
            timestamp: new Date(),
            reason: null
        };

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    assigned_to: new_engineer_id,
                    engineer_name: newEngineer.name,
                    assigned_by,
                    assigned_time: new Date(),
                    task_status: 'assigned',
                    modified_by: assigned_by,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        res.json({
            success: true,
            message: 'Task reassigned to new engineer successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reassigning task',
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
    createTask,
    getTaskById,
    getServices,
    getInstallation,
    assignTask,
    reassignTask,
    getEngineerHistory
};
