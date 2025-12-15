const { getDB } = require('../../config/database');
const logger = require('../../config/logger');

const search = async (req, res) => {
    try {
        const { type, query, user_id } = req.query;
        const { page, limit, skip } = req.pagination;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'type is required (user, role, model, device, service, installation)'
            });
        }

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'query is required'
            });
        }

        const db = getDB();
        const searchQuery = query.trim();
        let results = [];
        let totalItems = 0;
        let additionalData = {};

        switch (type.toLowerCase()) {
            case 'user':
                let userSearchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { email: { $regex: searchQuery, $options: 'i' } },
                        { phone: { $regex: searchQuery, $options: 'i' } }
                    ]
                };

                if (user_id) {
                    const requestingUser = await db.collection('users').findOne({ user_id });
                    
                    if (!requestingUser || !requestingUser.roles || !requestingUser.roles.includes(1)) {
                        userSearchQuery = {
                            status: true,
                            $and: [
                                {
                                    $or: [
                                        { name: { $regex: searchQuery, $options: 'i' } },
                                        { email: { $regex: searchQuery, $options: 'i' } },
                                        { phone: { $regex: searchQuery, $options: 'i' } }
                                    ]
                                },
                                {
                                    $or: [
                                        { distributor: user_id },
                                        { local_distributor: user_id }
                                    ]
                                }
                            ]
                        };
                    }
                }

                totalItems = await db.collection('users').countDocuments(userSearchQuery);
                results = await db.collection('users')
                    .find(userSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                results = results.map(user => ({
                    ...user,
                    password: undefined
                }));
                break;

            case 'role':
                const roleSearchQuery = {
                    status: true,
                    role_name: { $regex: searchQuery, $options: 'i' }
                };

                totalItems = await db.collection('roles').countDocuments(roleSearchQuery);
                results = await db.collection('roles')
                    .find(roleSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                break;

            case 'model':
                const modelSearchQuery = {
                    status: true,
                    name: { $regex: searchQuery, $options: 'i' }
                };

                totalItems = await db.collection('models').countDocuments(modelSearchQuery);
                results = await db.collection('models')
                    .find(modelSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                break;

            case 'device':
                let deviceSearchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { device_id: { $regex: searchQuery, $options: 'i' } }
                    ]
                };

                if (user_id) {
                    const requestingUser = await db.collection('users').findOne({ user_id });
                    
                    if (!requestingUser || !requestingUser.roles || !requestingUser.roles.includes(1)) {
                        deviceSearchQuery = {
                            status: true,
                            $and: [
                                {
                                    $or: [
                                        { name: { $regex: searchQuery, $options: 'i' } },
                                        { device_id: { $regex: searchQuery, $options: 'i' } }
                                    ]
                                },
                                {
                                    $or: [
                                        { assigned_to: user_id },
                                        { assigned_to_local: user_id }
                                    ]
                                }
                            ]
                        };
                    }
                }

                totalItems = await db.collection('devices').countDocuments(deviceSearchQuery);
                results = await db.collection('devices')
                    .find(deviceSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                break;

            case 'service':
                let serviceSearchQuery = isNaN(searchQuery) ? {
                    status: true,
                    service_type: 2,
                    $or: [
                        { customer_name: { $regex: searchQuery, $options: 'i' } },
                        { model_name: { $regex: searchQuery, $options: 'i' } },
                        { engineer_name: { $regex: searchQuery, $options: 'i' } }
                    ]
                } : {
                    status: true,
                    service_type: 2,
                    task_id: parseInt(searchQuery)
                };

                if (user_id) {
                    const requestingUser = await db.collection('users').findOne({ user_id });
                    
                    if (!requestingUser || !requestingUser.roles || !requestingUser.roles.includes(1)) {
                        if (isNaN(searchQuery)) {
                            serviceSearchQuery = {
                                status: true,
                                service_type: 2,
                                $and: [
                                    {
                                        $or: [
                                            { customer_name: { $regex: searchQuery, $options: 'i' } },
                                            { model_name: { $regex: searchQuery, $options: 'i' } },
                                            { engineer_name: { $regex: searchQuery, $options: 'i' } }
                                        ]
                                    },
                                    {
                                        $or: [
                                            { distributor_id: user_id },
                                            { local_distributor_id: user_id }
                                        ]
                                    }
                                ]
                            };
                        } else {
                            serviceSearchQuery = {
                                status: true,
                                service_type: 2,
                                task_id: parseInt(searchQuery),
                                $or: [
                                    { distributor_id: user_id },
                                    { local_distributor_id: user_id }
                                ]
                            };
                        }
                    }
                }

                totalItems = await db.collection('tasks').countDocuments(serviceSearchQuery);
                results = await db.collection('tasks')
                    .find(serviceSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                const serviceStatusCounts = await db.collection('tasks').aggregate([
                    { $match: serviceSearchQuery },
                    { $group: { _id: '$task_status', count: { $sum: 1 } } }
                ]).toArray();

                const serviceStatusSummary = {};
                serviceStatusCounts.forEach(item => {
                    serviceStatusSummary[item._id] = item.count;
                });

                additionalData.status_counts = serviceStatusSummary;
                break;

            case 'installation':
                let installSearchQuery = isNaN(searchQuery) ? {
                    status: true,
                    service_type: 1,
                    $or: [
                        { customer_name: { $regex: searchQuery, $options: 'i' } },
                        { device_id: { $regex: searchQuery, $options: 'i' } },
                        { model_name: { $regex: searchQuery, $options: 'i' } },
                        { engineer_name: { $regex: searchQuery, $options: 'i' } }
                    ]
                } : {
                    status: true,
                    service_type: 1,
                    task_id: parseInt(searchQuery)
                };

                if (user_id) {
                    const requestingUser = await db.collection('users').findOne({ user_id });
                    
                    if (!requestingUser || !requestingUser.roles || !requestingUser.roles.includes(1)) {
                        if (isNaN(searchQuery)) {
                            installSearchQuery = {
                                status: true,
                                service_type: 1,
                                $and: [
                                    {
                                        $or: [
                                            { customer_name: { $regex: searchQuery, $options: 'i' } },
                                            { device_id: { $regex: searchQuery, $options: 'i' } },
                                            { model_name: { $regex: searchQuery, $options: 'i' } },
                                            { engineer_name: { $regex: searchQuery, $options: 'i' } }
                                        ]
                                    },
                                    {
                                        $or: [
                                            { distributor_id: user_id },
                                            { local_distributor_id: user_id }
                                        ]
                                    }
                                ]
                            };
                        } else {
                            installSearchQuery = {
                                status: true,
                                service_type: 1,
                                task_id: parseInt(searchQuery),
                                $or: [
                                    { distributor_id: user_id },
                                    { local_distributor_id: user_id }
                                ]
                            };
                        }
                    }
                }

                totalItems = await db.collection('tasks').countDocuments(installSearchQuery);
                results = await db.collection('tasks')
                    .find(installSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                const installStatusCounts = await db.collection('tasks').aggregate([
                    { $match: installSearchQuery },
                    { $group: { _id: '$task_status', count: { $sum: 1 } } }
                ]).toArray();

                const installStatusSummary = {};
                installStatusCounts.forEach(item => {
                    installStatusSummary[item._id] = item.count;
                });

                additionalData.status_counts = installStatusSummary;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be one of: user, role, model, device, service, installation'
                });
        }

        req.paginationTotal = totalItems;

        logger.info(`[SEARCH] Type: ${type}, Query: ${searchQuery}, Results: ${results.length}/${totalItems}`);

        res.json({
            success: true,
            data: results,
            total_count: totalItems,
            ...additionalData
        });

    } catch (error) {
        logger.error('[SEARCH] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing search',
            error: error.message
        });
    }
};

module.exports = {
    search
};
