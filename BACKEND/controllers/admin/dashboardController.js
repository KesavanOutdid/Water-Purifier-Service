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

            const topDistributors = await Promise.all(
                distributors.map(async (dist) => {
                    const taskQuery = { 
                        status: true, 
                        distributor_id: dist.user_id
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

            topDistributors.sort((a, b) => b.total_tasks - a.total_tasks);

            const localDistributors = await db.collection('users').find({ 
                status: true, 
                roles: 3 
            }).toArray();

            const topLocalDistributors = await Promise.all(
                localDistributors.map(async (ldist) => {
                    const taskQuery = { 
                        status: true, 
                        local_distributor_id: ldist.user_id
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

            topLocalDistributors.sort((a, b) => b.total_tasks - a.total_tasks);

            const engineers = await db.collection('users').find({ 
                status: true, 
                roles: 4 
            }).toArray();

            const topEngineers = await Promise.all(
                engineers.map(async (eng) => {
                    const taskQuery = { 
                        status: true, 
                        assigned_to: eng.user_id
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

            topEngineers.sort((a, b) => b.total_tasks - a.total_tasks);

            dashboardData = {
                role: 'admin',
                total_roles: uniqueRoles.length,
                total_users: totalUsers,
                total_tasks: totalTasks,
                total_tasks_completed: totalTasksCompleted,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                users_by_role: usersByRole.map(r => ({ role: r._id, count: r.count })),
                top_5_distributors: topDistributors.slice(0, 5),
                top_5_local_distributors: topLocalDistributors.slice(0, 5),
                top_5_engineers: topEngineers.slice(0, 5)
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

            const localDistributorsUnder = await db.collection('users').find({
                status: true,
                distributor: user_id,
                roles: 3
            }).toArray();

            const topLocalDistributors = await Promise.all(
                localDistributorsUnder.map(async (ldist) => {
                    const taskQuery = { 
                        status: true, 
                        local_distributor_id: ldist.user_id
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

            topLocalDistributors.sort((a, b) => b.total_tasks - a.total_tasks);

            const engineersUnder = await db.collection('users').find({
                status: true,
                distributor: user_id,
                roles: 4
            }).toArray();

            const topEngineers = await Promise.all(
                engineersUnder.map(async (eng) => {
                    const taskQuery = { 
                        status: true, 
                        assigned_to: eng.user_id,
                        distributor_id: user_id
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

            topEngineers.sort((a, b) => b.total_tasks - a.total_tasks);

            dashboardData = {
                role: 'distributor',
                roles_under: rolesUnderDistributor,
                total_users_under: usersUnderDistributor,
                users_by_role_under: usersByRole.map(r => ({ role: r._id, count: r.count })),
                total_tasks_under: tasksUnderDistributor,
                completed_tasks_under: completedTasksUnderDistributor,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                top_5_local_distributors: topLocalDistributors.slice(0, 5),
                top_5_engineers: topEngineers.slice(0, 5)
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

            const engineersUnder = await db.collection('users').find({
                status: true,
                local_distributor: user_id,
                roles: 4
            }).toArray();

            const topEngineers = await Promise.all(
                engineersUnder.map(async (eng) => {
                    const taskQuery = { 
                        status: true, 
                        assigned_to: eng.user_id,
                        local_distributor_id: user_id
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

            topEngineers.sort((a, b) => b.total_tasks - a.total_tasks);

            dashboardData = {
                role: 'local_distributor',
                roles_under: rolesUnderLocalDistributor,
                total_users_under: usersUnderLocalDistributor,
                total_tasks_under: tasksUnderLocalDistributor,
                completed_tasks_under: completedTasksUnderLocalDistributor,
                today_tasks: todayTasks,
                week_tasks: weekTasks,
                month_tasks: monthTasks,
                year_tasks: yearTasks,
                top_5_engineers: topEngineers.slice(0, 5)
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
