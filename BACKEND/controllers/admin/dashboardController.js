const { getDB } = require('../../config/database');

const getDashboard = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const db = getDB();
        const requestingUser = await db.collection('users').findOne({ user_id });

        if (!requestingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let dashboardData = {};

        if (requestingUser.roles && requestingUser.roles.includes(1)) {
            const totalRoles = await db.collection('users').distinct('roles', { status: true });
            const uniqueRoles = [...new Set(totalRoles.flat())];
            
            const totalUsers = await db.collection('users').countDocuments({ status: true });
            const totalTasks = await db.collection('tasks').countDocuments({ status: true });
            const totalTasksCompleted = await db.collection('tasks').countDocuments({ 
                status: true, 
                task_status: 'completed' 
            });

            const totalModels = await db.collection('models').countDocuments({ status: true });
            const totalDevices = await db.collection('devices').countDocuments({});
            const activeDevices = await db.collection('devices').countDocuments({ status: true });

            const modelDeviceCounts = await db.collection('devices').aggregate([
                { $match: { status: true } },
                { $group: { _id: '$model_id', device_count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'models',
                        localField: '_id',
                        foreignField: 'uid',
                        as: 'model_info'
                    }
                },
                { $unwind: { path: '$model_info', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        model_id: '$_id',
                        model_name: '$model_info.name',
                        device_count: 1,
                        _id: 0
                    }
                },
                { $sort: { device_count: -1 } }
            ]).toArray();

            const usersByRole = await db.collection('users').aggregate([
                { $match: { status: true } },
                { $unwind: '$roles' },
                { $group: { _id: '$roles', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray();

            const todayTasks = await db.collection('tasks').countDocuments({
                status: true,
                created_time: { $gte: startOfDay }
            });

            const weekTasks = await db.collection('tasks').countDocuments({
                status: true,
                created_time: { $gte: startOfWeek }
            });

            const monthTasks = await db.collection('tasks').countDocuments({
                status: true,
                created_time: { $gte: startOfMonth }
            });

            const yearTasks = await db.collection('tasks').countDocuments({
                status: true,
                created_time: { $gte: startOfYear }
            });

            const distributors = await db.collection('users').find({ 
                status: true, 
                roles: 2 
            }).toArray();

            const calculateTopDistributors = async (timeFilter = null) => {
                const results = await Promise.all(
                    distributors.map(async (dist) => {
                        const taskQuery = { 
                            status: true, 
                            distributor_id: dist.user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: dist.user_id,
                            name: dist.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const localDistributors = await db.collection('users').find({ 
                status: true, 
                roles: 3 
            }).toArray();

            const calculateTopLocalDistributors = async (timeFilter = null) => {
                const results = await Promise.all(
                    localDistributors.map(async (ldist) => {
                        const taskQuery = { 
                            status: true, 
                            local_distributor_id: ldist.user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: ldist.user_id,
                            name: ldist.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const engineers = await db.collection('users').find({ 
                status: true, 
                roles: 4 
            }).toArray();

            const calculateTopEngineers = async (timeFilter = null) => {
                const results = await Promise.all(
                    engineers.map(async (eng) => {
                        const taskQuery = { 
                            status: true, 
                            assigned_to: eng.user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: eng.user_id,
                            name: eng.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const [
                todayTopDistributors, weekTopDistributors, monthTopDistributors, yearTopDistributors,
                todayTopLocalDistributors, weekTopLocalDistributors, monthTopLocalDistributors, yearTopLocalDistributors,
                todayTopEngineers, weekTopEngineers, monthTopEngineers, yearTopEngineers
            ] = await Promise.all([
                calculateTopDistributors(startOfDay),
                calculateTopDistributors(startOfWeek),
                calculateTopDistributors(startOfMonth),
                calculateTopDistributors(startOfYear),
                calculateTopLocalDistributors(startOfDay),
                calculateTopLocalDistributors(startOfWeek),
                calculateTopLocalDistributors(startOfMonth),
                calculateTopLocalDistributors(startOfYear),
                calculateTopEngineers(startOfDay),
                calculateTopEngineers(startOfWeek),
                calculateTopEngineers(startOfMonth),
                calculateTopEngineers(startOfYear)
            ]);

            dashboardData = {
                role: 'admin',
                total_roles: uniqueRoles.length,
                total_users: totalUsers,
                total_tasks: totalTasks,
                total_tasks_completed: totalTasksCompleted,
                active_models: totalModels,
                total_devices: totalDevices,
                active_devices: activeDevices,
                model_device_counts: modelDeviceCounts,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                users_by_role: usersByRole.map(r => ({ role: r._id, count: r.count })),
                today_top_5_distributors: todayTopDistributors,
                week_top_5_distributors: weekTopDistributors,
                month_top_5_distributors: monthTopDistributors,
                year_top_5_distributors: yearTopDistributors,
                today_top_5_local_distributors: todayTopLocalDistributors,
                week_top_5_local_distributors: weekTopLocalDistributors,
                month_top_5_local_distributors: monthTopLocalDistributors,
                year_top_5_local_distributors: yearTopLocalDistributors,
                today_top_5_engineers: todayTopEngineers,
                week_top_5_engineers: weekTopEngineers,
                month_top_5_engineers: monthTopEngineers,
                year_top_5_engineers: yearTopEngineers
            };

        } else if (requestingUser.roles && requestingUser.roles.includes(2)) {
            const rolesUnderDistributor = [3, 4];
            
            const usersUnderDistributor = await db.collection('users').countDocuments({
                status: true,
                distributor: user_id
            });

            const usersByRole = await db.collection('users').aggregate([
                { $match: { status: true, distributor: user_id } },
                { $unwind: '$roles' },
                { $group: { _id: '$roles', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray();

            const tasksUnderDistributor = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id
            });

            const completedTasksUnderDistributor = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id,
                task_status: 'completed'
            });

            const todayTasks = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id,
                created_time: { $gte: startOfDay }
            });

            const weekTasks = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id,
                created_time: { $gte: startOfWeek }
            });

            const monthTasks = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id,
                created_time: { $gte: startOfMonth }
            });

            const yearTasks = await db.collection('tasks').countDocuments({
                status: true,
                distributor_id: user_id,
                created_time: { $gte: startOfYear }
            });

            const totalModels = await db.collection('models').countDocuments({ status: true });
            const totalDevices = await db.collection('devices').countDocuments({ assigned_to: user_id });
            const activeDevices = await db.collection('devices').countDocuments({ assigned_to: user_id, status: true });

            const modelDeviceCounts = await db.collection('devices').aggregate([
                { $match: { assigned_to: user_id, status: true } },
                { $group: { _id: '$model_id', device_count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'models',
                        localField: '_id',
                        foreignField: 'uid',
                        as: 'model_info'
                    }
                },
                { $unwind: { path: '$model_info', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        model_id: '$_id',
                        model_name: '$model_info.name',
                        device_count: 1,
                        _id: 0
                    }
                },
                { $sort: { device_count: -1 } }
            ]).toArray();

            const localDistributorsUnder = await db.collection('users').find({
                status: true,
                distributor: user_id,
                roles: 3
            }).toArray();

            const calculateTopLocalDistributorsUnder = async (timeFilter = null) => {
                const results = await Promise.all(
                    localDistributorsUnder.map(async (ldist) => {
                        const taskQuery = { 
                            status: true, 
                            local_distributor_id: ldist.user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: ldist.user_id,
                            name: ldist.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const engineersUnder = await db.collection('users').find({
                status: true,
                distributor: user_id,
                roles: 4
            }).toArray();

            const calculateTopEngineersUnder = async (timeFilter = null) => {
                const results = await Promise.all(
                    engineersUnder.map(async (eng) => {
                        const taskQuery = { 
                            status: true, 
                            assigned_to: eng.user_id,
                            distributor_id: user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: eng.user_id,
                            name: eng.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const [
                todayTopLocalDistributors, weekTopLocalDistributors, monthTopLocalDistributors, yearTopLocalDistributors,
                todayTopEngineers, weekTopEngineers, monthTopEngineers, yearTopEngineers
            ] = await Promise.all([
                calculateTopLocalDistributorsUnder(startOfDay),
                calculateTopLocalDistributorsUnder(startOfWeek),
                calculateTopLocalDistributorsUnder(startOfMonth),
                calculateTopLocalDistributorsUnder(startOfYear),
                calculateTopEngineersUnder(startOfDay),
                calculateTopEngineersUnder(startOfWeek),
                calculateTopEngineersUnder(startOfMonth),
                calculateTopEngineersUnder(startOfYear)
            ]);

            dashboardData = {
                role: 'distributor',
                total_users: usersUnderDistributor,
                users_by_role: usersByRole.map(r => ({ role: r._id, count: r.count })),
                total_tasks: tasksUnderDistributor,
                total_tasks_completed: completedTasksUnderDistributor,
                active_models: totalModels,
                total_devices: totalDevices,
                active_devices: activeDevices,
                model_device_counts: modelDeviceCounts,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                today_top_5_local_distributors: todayTopLocalDistributors,
                week_top_5_local_distributors: weekTopLocalDistributors,
                month_top_5_local_distributors: monthTopLocalDistributors,
                year_top_5_local_distributors: yearTopLocalDistributors,
                today_top_5_engineers: todayTopEngineers,
                week_top_5_engineers: weekTopEngineers,
                month_top_5_engineers: monthTopEngineers,
                year_top_5_engineers: yearTopEngineers
            };

        } else if (requestingUser.roles && requestingUser.roles.includes(3)) {
            const rolesUnderLocalDistributor = [4];
            
            const usersUnderLocalDistributor = await db.collection('users').countDocuments({
                status: true,
                local_distributor: user_id
            });

            const tasksUnderLocalDistributor = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id
            });

            const completedTasksUnderLocalDistributor = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id,
                task_status: 'completed'
            });

            const todayTasks = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id,
                created_time: { $gte: startOfDay }
            });

            const weekTasks = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id,
                created_time: { $gte: startOfWeek }
            });

            const monthTasks = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id,
                created_time: { $gte: startOfMonth }
            });

            const yearTasks = await db.collection('tasks').countDocuments({
                status: true,
                local_distributor_id: user_id,
                created_time: { $gte: startOfYear }
            });

            const totalModels = await db.collection('models').countDocuments({ status: true });
            const totalDevices = await db.collection('devices').countDocuments({ assigned_to_local: user_id });
            const activeDevices = await db.collection('devices').countDocuments({ assigned_to_local: user_id, status: true });

            const modelDeviceCounts = await db.collection('devices').aggregate([
                { $match: { assigned_to_local: user_id, status: true } },
                { $group: { _id: '$model_id', device_count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'models',
                        localField: '_id',
                        foreignField: 'uid',
                        as: 'model_info'
                    }
                },
                { $unwind: { path: '$model_info', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        model_id: '$_id',
                        model_name: '$model_info.name',
                        device_count: 1,
                        _id: 0
                    }
                },
                { $sort: { device_count: -1 } }
            ]).toArray();

            const engineersUnder = await db.collection('users').find({
                status: true,
                local_distributor: user_id,
                roles: 4
            }).toArray();

            const calculateTopEngineersUnder = async (timeFilter = null) => {
                const results = await Promise.all(
                    engineersUnder.map(async (eng) => {
                        const taskQuery = { 
                            status: true, 
                            assigned_to: eng.user_id,
                            local_distributor_id: user_id,
                            ...(timeFilter && { created_time: { $gte: timeFilter } })
                        };
                        const totalTasks = await db.collection('tasks').countDocuments(taskQuery);
                        const completedTasks = await db.collection('tasks').countDocuments({ 
                            ...taskQuery, 
                            task_status: 'completed' 
                        });
                        return {
                            user_id: eng.user_id,
                            name: eng.name,
                            total_tasks: totalTasks,
                            completed_tasks: completedTasks
                        };
                    })
                );
                results.sort((a, b) => b.total_tasks - a.total_tasks);
                return results.slice(0, 5);
            };

            const [
                todayTopEngineers, weekTopEngineers, monthTopEngineers, yearTopEngineers
            ] = await Promise.all([
                calculateTopEngineersUnder(startOfDay),
                calculateTopEngineersUnder(startOfWeek),
                calculateTopEngineersUnder(startOfMonth),
                calculateTopEngineersUnder(startOfYear)
            ]);

            dashboardData = {
                role: 'local_distributor',
                total_users: usersUnderLocalDistributor,
                total_tasks: tasksUnderLocalDistributor,
                total_tasks_completed: completedTasksUnderLocalDistributor,
                active_models: totalModels,
                total_devices: totalDevices,
                active_devices: activeDevices,
                model_device_counts: modelDeviceCounts,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                today_top_5_engineers: todayTopEngineers,
                week_top_5_engineers: weekTopEngineers,
                month_top_5_engineers: monthTopEngineers,
                year_top_5_engineers: yearTopEngineers
            };

        } else {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions for dashboard access'
            });
        }

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

module.exports = {
    getDashboard
};
