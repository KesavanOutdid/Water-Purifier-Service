const { getDB } = require('../../config/database');
const logger = require('../../config/logger');

const search = async (req, res) => {
    try {
        const { type, query } = req.query;
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
                const userSearchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { email: { $regex: searchQuery, $options: 'i' } },
                        { phone: { $regex: searchQuery, $options: 'i' } }
                    ]
                };

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
                const deviceSearchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { device_id: { $regex: searchQuery, $options: 'i' } }
                    ]
                };

                totalItems = await db.collection('devices').countDocuments(deviceSearchQuery);
                results = await db.collection('devices')
                    .find(deviceSearchQuery)
                    .sort({ created_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                break;

            case 'service':
                const serviceSearchQuery = isNaN(searchQuery) ? {
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
                const installSearchQuery = isNaN(searchQuery) ? {
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

        logger.info(`[APP-SEARCH] Type: ${type}, Query: ${searchQuery}, Results: ${results.length}/${totalItems}`);

        res.json({
            success: true,
            data: results,
            total_count: totalItems,
            ...additionalData
        });

    } catch (error) {
        logger.error('[APP-SEARCH] Error:', error);
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
