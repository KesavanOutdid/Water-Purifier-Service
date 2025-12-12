const { getDB } = require('../config/database');

const createIndexes = async () => {
    try {
        const db = getDB();
        
        console.log('Creating indexes...');

        await db.collection('users').createIndex({ status: 1, created_time: -1 });
        await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
        await db.collection('users').createIndex({ email: 1 });
        await db.collection('users').createIndex({ distributor: 1 });
        await db.collection('users').createIndex({ local_distributor: 1 });
        await db.collection('users').createIndex({ roles: 1 });
        console.log('✓ User indexes created');

        await db.collection('roles').createIndex({ status: 1, created_time: -1 });
        await db.collection('roles').createIndex({ role_id: 1 }, { unique: true });
        console.log('✓ Role indexes created');

        await db.collection('models').createIndex({ status: 1, created_time: -1 });
        await db.collection('models').createIndex({ uid: 1 }, { unique: true });
        console.log('✓ Model indexes created');

        await db.collection('devices').createIndex({ status: 1, created_time: -1 });
        await db.collection('devices').createIndex({ device_id: 1 }, { unique: true });
        await db.collection('devices').createIndex({ assigned_to: 1 });
        await db.collection('devices').createIndex({ assigned_to_local: 1 });
        await db.collection('devices').createIndex({ model_id: 1 });
        await db.collection('devices').createIndex({ allotted: 1 });
        console.log('✓ Device indexes created');

        await db.collection('tasks').createIndex({ status: 1, service_type: 1, created_time: -1 });
        await db.collection('tasks').createIndex({ task_id: 1 }, { unique: true });
        await db.collection('tasks').createIndex({ task_status: 1 });
        await db.collection('tasks').createIndex({ distributor_id: 1 });
        await db.collection('tasks').createIndex({ local_distributor_id: 1 });
        await db.collection('tasks').createIndex({ assigned_to: 1 });
        await db.collection('tasks').createIndex({ model_id: 1 });
        await db.collection('tasks').createIndex({ service_type: 1, task_status: 1 });
        console.log('✓ Task indexes created');

        await db.collection('permissions').createIndex({ role_id: 1 });
        await db.collection('permissions').createIndex({ module: 1 });
        console.log('✓ Permission indexes created');

        console.log('All indexes created successfully!');
    } catch (error) {
        console.error('Error creating indexes:', error);
        throw error;
    }
};

module.exports = createIndexes;
