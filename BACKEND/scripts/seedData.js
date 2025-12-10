const { getDB } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
    try {
        const db = getDB();

        const superAdminRole = await db.collection('roles').findOne({ role_name: 'Super Admin' });

        let superAdminRoleId;

        if (!superAdminRole) {
            console.log('Creating Super Admin role...');
            
            const lastRole = await db.collection('roles')
                .find()
                .sort({ role_id: -1 })
                .limit(1)
                .toArray();
            
            superAdminRoleId = lastRole.length > 0 ? lastRole[0].role_id + 1 : 1;

            const newRole = {
                role_id: 1,
                role_name: 'Super Admin',
                created_by: 'system',
                created_time: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };

            await db.collection('roles').insertOne(newRole);
            console.log('Super Admin role created successfully');
        } else {
            superAdminRoleId = superAdminRole.role_id;
            console.log('Super Admin role already exists');
        }

        const adminUser = await db.collection('users').findOne({ email: 'admin@gmail.com' });

        if (!adminUser) {
            console.log('Creating admin@gmail.com user...');

            const user_id = uuidv4();

            const newUser = {
                user_id,
                name: 'Super Admin',
                email: 'admin@gmail.com',
                number: '+919999999999',
                password: 'admin123',
                roles: [1],
                role_names: ['Super Admin'],
                address: {
                    doorno: '1',
                    street: 'MG Road',
                    city: 'Bengaluru',
                    district: 'Bangalore Urban',
                    state: 'Karnataka',
                    country: 'India',
                    pincode: '560001'
                },
                distributor: null,
                local_distributor: null,
                created_by: 'system',
                created_at: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };

            await db.collection('users').insertOne(newUser);
            console.log('admin@gmail.com user created successfully');
        } else {
            console.log('admin@gmail.com user already exists');
        }

        console.log('Seed data initialization completed');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

module.exports = seedData;
