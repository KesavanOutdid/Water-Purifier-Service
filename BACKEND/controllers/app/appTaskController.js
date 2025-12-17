const { getDB } = require('../../config/database');
const { clearCache } = require('../../middleware/cache');
const { reassignTask } = require('../../services/autoAssignService');
const logger = require('../../config/logger');

const getTasksByEngineer = async (req, res) => {
    try {
        const { engineer_id } = req.params;
        const db = getDB();

        const assignedQuery = { 
            assigned_to: engineer_id,
            task_status: 'assigned',
            status: true 
        };

        const acceptedQuery = { 
            assigned_to: engineer_id,
            task_status: { $in: ['accepted', 'in_progress'] },
            status: true 
        };

        const completedQuery = { 
            assigned_to: engineer_id,
            task_status: 'completed',
            status: true 
        };

        const rejectedQuery = {
            'task_history.engineer_id': engineer_id,
            'task_history.action': 'reject',
            status: true
        };

        const [assignedTasks, acceptedTasks, completedTasks, rejectedTasksAll] = await Promise.all([
            db.collection('tasks').find(assignedQuery).sort({ assigned_time: -1 }).toArray(),
            db.collection('tasks').find(acceptedQuery).sort({ assigned_time: -1 }).toArray(),
            db.collection('tasks').find(completedQuery).sort({ completed_time: -1 }).toArray(),
            db.collection('tasks').find(rejectedQuery).sort({ modified_time: -1 }).toArray()
        ]);

        const rejectedTasks = rejectedTasksAll
            .filter(task => {
                const rejectionHistory = task.task_history.find(
                    h => h.action === 'reject' && h.engineer_id === engineer_id
                );
                return rejectionHistory !== undefined;
            })
            .map(task => {
                const myRejection = task.task_history.find(
                    h => h.action === 'reject' && h.engineer_id === engineer_id
                );
                return {
                    task_id: task.task_id,
                    customer_name: task.customer_name,
                    address: task.address,
                    phone: task.phone,
                    email: task.email,
                    service_type: task.service_type,
                    model_id: task.model_id,
                    model_name: task.model_name,
                    rejection_reason: myRejection.reason,
                    rejected_at: myRejection.timestamp
                };
            });

        res.json({
            success: true,
            data: {
                assigned: assignedTasks,
                accepted: acceptedTasks,
                completed: completedTasks,
                rejected: rejectedTasks
            }
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

        await clearCache('tasks:*');

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

        await clearCache('tasks:*');

        reassignTask(
            parseInt(task_id),
            `Rejected by ${task.engineer_name}: ${reason}`,
            engineer_id
        ).catch(err => 
            logger.error(`[REJECT-TASK] Auto-reassignment failed for task ${task_id}:`, err)
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

const waitTask = async (req, res) => {
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

        if (task.task_status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Task must be accepted first to mark as waiting'
            });
        }

        const historyRecord = {
            action: 'wait',
            engineer_id: engineer_id,
            engineer_name: task.engineer_name,
            timestamp: new Date(),
            reason: reason
        };

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    waiting: true,
                    waiting_reason: reason,
                    modified_by: engineer_id,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        await clearCache('tasks:*');

        res.json({
            success: true,
            message: 'Task marked as waiting successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking task as waiting',
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

        if (!task.device_mac_id) {
            return res.status(400).json({
                success: false,
                message: 'Device MAC ID must be configured before completing the task'
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
                    configStatus: true,
                    mac_id: task.device_mac_id,
                    customer_name: task.customer_name,
                    customer_phone: task.phone,
                    customer_email: task.email,
                    customer_address: task.address,
                    allotted_by: engineer_id,
                    allotted_time: new Date(),
                    configured_by: engineer_id,
                    configured_time: new Date(),
                    task_id: task.task_id,
                    modified_by: engineer_id,
                    modified_time: new Date()
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

        await clearCache('tasks:*');

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
        const db = getDB();

        const completedQuery = { 
            assigned_to: engineer_id,
            task_status: 'completed',
            status: true 
        };

        const rejectedQuery = {
            'task_history.engineer_id': engineer_id,
            'task_history.action': 'reject',
            status: true
        };

        const [completedTasks, rejectedTasksAll] = await Promise.all([
            db.collection('tasks').find(completedQuery).sort({ completed_time: -1 }).toArray(),
            db.collection('tasks').find(rejectedQuery).sort({ modified_time: -1 }).toArray()
        ]);

        const rejectedTasks = rejectedTasksAll
            .filter(task => {
                const rejectionHistory = task.task_history.find(
                    h => h.action === 'reject' && h.engineer_id === engineer_id
                );
                return rejectionHistory !== undefined;
            })
            .map(task => {
                const myRejection = task.task_history.find(
                    h => h.action === 'reject' && h.engineer_id === engineer_id
                );
                return {
                    task_id: task.task_id,
                    customer_name: task.customer_name,
                    address: task.address,
                    phone: task.phone,
                    email: task.email,
                    service_type: task.service_type,
                    model_id: task.model_id,
                    model_name: task.model_name,
                    rejection_reason: myRejection.reason,
                    rejected_at: myRejection.timestamp
                };
            });

        res.json({
            success: true,
            data: {
                completed: completedTasks,
                rejected: rejectedTasks
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching engineer history',
            error: error.message
        });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const { engineer_id } = req.params;
        
        // logger.info(`[DASHBOARD] Using mock data for engineer ${engineer_id}`);
        // const fs = require('fs');
        // const path = require('path');
        // const mockDataPath = path.join(__dirname, '../../mock-data/dashboard-mock.lock.json');
        // const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
        // 
        // return res.json({
        //     success: true,
        //     data: mockData,
        //     mock: true
        // });
        
        const db = getDB();

        const now = new Date();
        
        logger.info(`[DASHBOARD] Fetching analytics for engineer ${engineer_id}`);
        
        const allTasks = await db.collection('tasks').find({
            assigned_to: engineer_id,
            status: true,
            $or: [
                { assigned_time: { $exists: true } },
                { modified_time: { $exists: true } },
                { completed_time: { $exists: true } }
            ]
        }).toArray();

        const rejectedTasks = await db.collection('tasks').find({
            'task_history.engineer_id': engineer_id,
            'task_history.action': 'reject',
            status: true
        }).toArray();

        const analytics = {
            current_day: {
                date: now.toISOString().split('T')[0],
                hours: {},
                total: { completed: 0, accepted: 0, rejected: 0 }
            },
            current_week: {
                week_range: '',
                days: {},
                total: { completed: 0, accepted: 0, rejected: 0 }
            },
            current_year: {
                year: now.getFullYear(),
                months: {},
                total: { completed: 0, accepted: 0, rejected: 0 }
            },
            yearly: {}
        };

        for (let hour = 0; hour < 24; hour++) {
            analytics.current_day.hours[hour] = { completed: 0, accepted: 0, rejected: 0 };
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayNames.forEach(day => {
            analytics.current_week.days[day] = { completed: 0, accepted: 0, rejected: 0 };
        });

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        monthNames.forEach(month => {
            analytics.current_year.months[month] = { completed: 0, accepted: 0, rejected: 0 };
        });

        const getWeekRange = () => {
            const curr = new Date(now);
            const first = curr.getDate() - curr.getDay();
            const last = first + 6;
            
            const firstDay = new Date(curr.setDate(first));
            const lastDay = new Date(curr.setDate(last));
            
            return `${firstDay.toISOString().split('T')[0]} to ${lastDay.toISOString().split('T')[0]}`;
        };

        analytics.current_week.week_range = getWeekRange();

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const yearsSet = new Set();
        allTasks.forEach(task => {
            if (task.completed_time) {
                yearsSet.add(new Date(task.completed_time).getFullYear());
            }
            if (task.task_status === 'accepted' || task.task_status === 'in_progress') {
                const acceptHistory = task.task_history?.find(h => h.action === 'accept');
                if (acceptHistory?.timestamp) {
                    yearsSet.add(new Date(acceptHistory.timestamp).getFullYear());
                } else if (task.modified_time) {
                    yearsSet.add(new Date(task.modified_time).getFullYear());
                }
            }
        });
        rejectedTasks.forEach(task => {
            const rejection = task.task_history.find(h => h.action === 'reject' && h.engineer_id === engineer_id);
            if (rejection) yearsSet.add(new Date(rejection.timestamp).getFullYear());
        });

        if (yearsSet.size === 0) {
            yearsSet.add(now.getFullYear());
        }

        yearsSet.forEach(year => {
            analytics.yearly[year] = { completed: 0, accepted: 0, rejected: 0 };
        });

        allTasks.forEach(task => {
            let taskDate = null;
            let isAccepted = false;
            let isCompleted = false;

            if (task.task_status === 'completed' && task.completed_time) {
                taskDate = new Date(task.completed_time);
                isCompleted = true;
            } else if (task.task_status === 'accepted' || task.task_status === 'in_progress') {
                const acceptHistory = task.task_history?.find(h => h.action === 'accept');
                if (acceptHistory?.timestamp) {
                    taskDate = new Date(acceptHistory.timestamp);
                    isAccepted = true;
                } else if (task.modified_time) {
                    taskDate = new Date(task.modified_time);
                    isAccepted = true;
                }
            }

            if (!taskDate) return;

            if (taskDate >= todayStart && taskDate <= todayEnd) {
                const hour = taskDate.getHours();
                if (isCompleted) {
                    analytics.current_day.hours[hour].completed++;
                    analytics.current_day.total.completed++;
                } else if (isAccepted) {
                    analytics.current_day.hours[hour].accepted++;
                    analytics.current_day.total.accepted++;
                }
            }

            if (taskDate >= weekStart && taskDate <= weekEnd) {
                const dayName = dayNames[taskDate.getDay()];
                if (isCompleted) {
                    analytics.current_week.days[dayName].completed++;
                    analytics.current_week.total.completed++;
                } else if (isAccepted) {
                    analytics.current_week.days[dayName].accepted++;
                    analytics.current_week.total.accepted++;
                }
            }

            if (taskDate >= yearStart && taskDate <= yearEnd) {
                const monthName = monthNames[taskDate.getMonth()];
                if (isCompleted) {
                    analytics.current_year.months[monthName].completed++;
                    analytics.current_year.total.completed++;
                } else if (isAccepted) {
                    analytics.current_year.months[monthName].accepted++;
                    analytics.current_year.total.accepted++;
                }
            }

            const year = taskDate.getFullYear();
            if (analytics.yearly[year]) {
                if (isCompleted) {
                    analytics.yearly[year].completed++;
                } else if (isAccepted) {
                    analytics.yearly[year].accepted++;
                }
            }
        });

        rejectedTasks.forEach(task => {
            const rejectionHistory = task.task_history.find(
                h => h.action === 'reject' && h.engineer_id === engineer_id
            );
            if (!rejectionHistory) return;

            const taskDate = new Date(rejectionHistory.timestamp);

            if (taskDate >= todayStart && taskDate <= todayEnd) {
                const hour = taskDate.getHours();
                analytics.current_day.hours[hour].rejected++;
                analytics.current_day.total.rejected++;
            }

            if (taskDate >= weekStart && taskDate <= weekEnd) {
                const dayName = dayNames[taskDate.getDay()];
                analytics.current_week.days[dayName].rejected++;
                analytics.current_week.total.rejected++;
            }

            if (taskDate >= yearStart && taskDate <= yearEnd) {
                const monthName = monthNames[taskDate.getMonth()];
                analytics.current_year.months[monthName].rejected++;
                analytics.current_year.total.rejected++;
            }

            const year = taskDate.getFullYear();
            if (analytics.yearly[year]) {
                analytics.yearly[year].rejected++;
            }
        });

        logger.info(`[DASHBOARD] Analytics generated successfully for engineer ${engineer_id}`);

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        logger.error('[DASHBOARD] Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

const configureDevice = async (req, res) => {
    try {
        const { task_id } = req.params;
        const { engineer_id, mac_id } = req.body;

        if (!engineer_id) {
            return res.status(400).json({
                success: false,
                message: 'engineer_id is required'
            });
        }

        if (!mac_id) {
            return res.status(400).json({
                success: false,
                message: 'mac_id is required'
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
                message: 'Task must be accepted or in progress to configure device'
            });
        }

        if (task.device_mac_id) {
            return res.status(400).json({
                success: false,
                message: 'Device MAC ID is already set for this task'
            });
        }

        await db.collection('tasks').updateOne(
            { task_id: parseInt(task_id) },
            { 
                $set: {
                    device_mac_id: mac_id,
                    device_configured_time: new Date(),
                    modified_by: engineer_id,
                    modified_time: new Date(),
                    configStatus: true
                }
            }
        );

        await clearCache('tasks:*');

        logger.info(`[CONFIGURE-DEVICE] MAC ID ${mac_id} set for task ${task_id} by engineer ${engineer_id}`);

        res.json({
            success: true,
            message: 'Device MAC ID configured successfully',
            data: {
                task_id: parseInt(task_id),
                mac_id,
                configured_time: new Date()
            }
        });
    } catch (error) {
        logger.error('[CONFIGURE-DEVICE] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error configuring device',
            error: error.message
        });
    }
};

module.exports = {
    getTasksByEngineer,
    getTaskById,
    acceptTask,
    rejectTask,
    waitTask,
    completeTask,
    getTaskHistory,
    getEngineerHistory,
    getDashboardStats,
    configureDevice
};
