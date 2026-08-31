const { getDB } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const MODULES = require('../config/moduleConfig');

const seedData = async () => {
    try {
        const db = getDB();

        console.log('--- SEEDING ROLES & PERMISSIONS ---');

        // 1. SEED ROLES
        const rolesToSeed = [
            { role_id: 1, role_name: 'Super Admin' },
            { role_id: 2, role_name: 'Distributor' },
            { role_id: 3, role_name: 'Local Distributor' },
            { role_id: 4, role_name: 'Service Engineer' }
        ];

        for (const role of rolesToSeed) {
            const existing = await db.collection('roles').findOne({ role_id: role.role_id });
            if (!existing) {
                await db.collection('roles').insertOne({
                    role_id: role.role_id,
                    role_name: role.role_name,
                    created_by: 'system',
                    created_time: new Date(),
                    modified_by: null,
                    modified_at: null,
                    status: true
                });
                console.log(`✓ Role created: ${role.role_name} (ID: ${role.role_id})`);
            } else {
                await db.collection('roles').updateOne(
                    { role_id: role.role_id },
                    { $set: { role_name: role.role_name, status: true } }
                );
            }
        }

        // 2. SEED PERMISSIONS FOR ALL ROLES
        // Super Admin (1) -> Full CRUD everywhere
        // Distributor (2) -> Regional View / User Create / Device Assign
        // Local Distributor (3) -> Local View / User Create / Tasks CRUD / Parts Update
        // Service Engineer (4) -> Tasks View & Update / View Devices, Models, Parts
        const rolePermissionRules = {
            1: { // Super Admin
                default: ['create', 'view', 'update', 'delete']
            },
            2: { // Distributor
                'Dashboard': ['view'],
                'Manage Users': ['create', 'view', 'update'],
                'Manage Roles': ['view'],
                'Manage Models': ['view'],
                'Manage Devices': ['view', 'update'],
                'Manage Part': ['view'],
                'Task Management:Manage Installation': ['view'],
                'Task Management:Manage Service': ['view'],
                'Settings': ['view', 'update']
            },
            3: { // Local Distributor
                'Dashboard': ['view'],
                'Manage Users': ['create', 'view', 'update'],
                'Manage Roles': ['view'],
                'Manage Models': ['view'],
                'Manage Devices': ['view', 'update'],
                'Manage Part': ['view', 'update'],
                'Task Management:Manage Installation': ['create', 'view', 'update', 'delete'],
                'Task Management:Manage Service': ['create', 'view', 'update', 'delete'],
                'Settings': ['view', 'update']
            },
            4: { // Service Engineer
                'Dashboard': ['view'],
                'Manage Users': ['view'],
                'Manage Roles': [],
                'Manage Models': ['view'],
                'Manage Devices': ['view'],
                'Manage Part': ['view'],
                'Task Management:Manage Installation': ['view', 'update'],
                'Task Management:Manage Service': ['view', 'update'],
                'Settings': ['view', 'update']
            }
        };

        for (const [roleIdStr, rules] of Object.entries(rolePermissionRules)) {
            const roleId = parseInt(roleIdStr, 10);

            for (const mod of MODULES) {
                if (mod.submodules && Array.isArray(mod.submodules)) {
                    for (const sub of mod.submodules) {
                        const key = `${mod.module}:${sub.name}`;
                        const allowedActions = rules.default || rules[key] || [];

                        const permDoc = {
                            role_id: roleId,
                            module: mod.module,
                            submodule: sub.name,
                            can_create: allowedActions.includes('create'),
                            can_view: allowedActions.includes('view'),
                            can_update: allowedActions.includes('update'),
                            can_delete: allowedActions.includes('delete'),
                            status: true,
                            updated_at: new Date()
                        };

                        await db.collection('permissions').updateOne(
                            { role_id: roleId, module: mod.module, submodule: sub.name },
                            { $set: permDoc },
                            { upsert: true }
                        );
                    }
                } else {
                    const allowedActions = rules.default || rules[mod.module] || [];

                    const permDoc = {
                        role_id: roleId,
                        module: mod.module,
                        submodule: null,
                        can_create: allowedActions.includes('create'),
                        can_view: allowedActions.includes('view'),
                        can_update: allowedActions.includes('update'),
                        can_delete: allowedActions.includes('delete'),
                        status: true,
                        updated_at: new Date()
                    };

                    await db.collection('permissions').updateOne(
                        { role_id: roleId, module: mod.module, submodule: null },
                        { $set: permDoc },
                        { upsert: true }
                    );
                }
            }
        }
        console.log('✓ All permissions seeded for Super Admin, Distributor, Local Distributor, and Service Engineer');

        // 3. SEED USER HIERARCHY
        // A. Super Admin
        let superAdmin = await db.collection('users').findOne({ email: 'admin@gmail.com' });
        const superAdminId = superAdmin?.user_id || uuidv4();
        if (!superAdmin) {
            superAdmin = {
                user_id: superAdminId,
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
                distributor_name: null,
                local_distributor: null,
                local_distributor_name: null,
                created_by: 'system',
                created_at: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };
            await db.collection('users').insertOne(superAdmin);
            console.log('✓ Seeded user: admin@gmail.com');
        }

        // B. Distributor (Regional)
        let distributor = await db.collection('users').findOne({ email: 'distributor@gmail.com' });
        const distributorId = distributor?.user_id || uuidv4();
        if (!distributor) {
            distributor = {
                user_id: distributorId,
                name: 'South Region Distributor',
                email: 'distributor@gmail.com',
                number: '+919888888888',
                password: 'distributor123',
                roles: [2],
                role_names: ['Distributor'],
                address: {
                    doorno: '10',
                    street: 'Mount Road',
                    city: 'Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600002'
                },
                distributor: null,
                distributor_name: null,
                local_distributor: null,
                local_distributor_name: null,
                created_by: 'admin@gmail.com',
                created_at: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };
            await db.collection('users').insertOne(distributor);
            console.log('✓ Seeded user: distributor@gmail.com');
        }

        // C. Local Distributor (City / Territory)
        let localDist = await db.collection('users').findOne({ email: 'localdist@gmail.com' });
        const localDistId = localDist?.user_id || uuidv4();
        if (!localDist) {
            localDist = {
                user_id: localDistId,
                name: 'Chennai Central Local Distributor',
                email: 'localdist@gmail.com',
                number: '+919777777777',
                password: 'localdist123',
                roles: [3],
                role_names: ['Local Distributor'],
                address: {
                    doorno: '45',
                    street: 'T Nagar Main Rd',
                    city: 'Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600017'
                },
                distributor: distributorId,
                distributor_name: 'South Region Distributor',
                local_distributor: null,
                local_distributor_name: null,
                created_by: 'distributor@gmail.com',
                created_at: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };
            await db.collection('users').insertOne(localDist);
            console.log('✓ Seeded user: localdist@gmail.com');
        }

        // D. Service Engineer (Field Technician - Mobile App)
        let engineer = await db.collection('users').findOne({ email: 'engineer@gmail.com' });
        const engineerId = engineer?.user_id || uuidv4();
        if (!engineer) {
            engineer = {
                user_id: engineerId,
                name: 'Karthik Service Engineer',
                email: 'engineer@gmail.com',
                number: '+919666666666',
                password: 'engineer123',
                roles: [4],
                role_names: ['Service Engineer'],
                address: {
                    doorno: '7',
                    street: 'Velachery Bypass',
                    city: 'Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600042'
                },
                distributor: distributorId,
                distributor_name: 'South Region Distributor',
                local_distributor: localDistId,
                local_distributor_name: 'Chennai Central Local Distributor',
                created_by: 'localdist@gmail.com',
                created_at: new Date(),
                modified_by: null,
                modified_at: null,
                status: true
            };
            await db.collection('users').insertOne(engineer);
            console.log('✓ Seeded user: engineer@gmail.com');
        }

        // 4. SEED SAMPLE MODELS
        const sampleModels = [
            {
                uid: 'MOD-RO-UV-2026',
                name: 'AquaPro UV+RO 2026',
                description: 'Advanced 8-stage RO+UV+UF with Alkaline Mineral Booster',
                specifications: { stages: 8, capacity: '12L/hr', storage: '10 Liters' },
                created_by: 'admin@gmail.com',
                created_time: new Date(),
                status: true
            },
            {
                uid: 'MOD-COPPER-15L',
                name: 'AquaPure Alkaline Copper 15L',
                description: 'Copper enriched Alkaline water purifier with smart IoT monitoring',
                specifications: { stages: 7, capacity: '15L/hr', storage: '15 Liters' },
                created_by: 'admin@gmail.com',
                created_time: new Date(),
                status: true
            }
        ];

        for (const model of sampleModels) {
            const existing = await db.collection('models').findOne({ uid: model.uid });
            if (!existing) {
                await db.collection('models').insertOne(model);
                console.log(`✓ Seeded Model: ${model.name}`);
            }
        }

        // 5. SEED SAMPLE PARTS
        const sampleParts = [
            'Sediment Filter 5 Micron',
            'Pre-Carbon Filter Block',
            'RO Membrane 75 GPD',
            'Post-Carbon Polishing Filter',
            'UV Lamp 11W Philips',
            'Alkaline Mineral Cartridge',
            'Booster Pump 24V DC'
        ];

        for (const partName of sampleParts) {
            const existing = await db.collection('parts').findOne({ name: partName });
            if (!existing) {
                await db.collection('parts').insertOne({
                    part_id: uuidv4(),
                    name: partName,
                    created_by: 'admin@gmail.com',
                    created_time: new Date(),
                    modified_by: null,
                    modified_time: null,
                    status: true
                });
                console.log(`✓ Seeded Part: ${partName}`);
            }
        }

        // 6. SEED SAMPLE DEVICES
        const sampleDevices = [
            {
                device_id: 'DEV-AQUA-001',
                device_name: 'AquaPro Smart Purifier #1',
                model_id: 'MOD-RO-UV-2026',
                bluetooth_mac: 'AA:BB:CC:11:22:33',
                assigned_to: distributorId,
                assigned_to_local: localDistId,
                assigned_by: 'admin@gmail.com',
                assigned_time: new Date(),
                assignment_history: [
                    {
                        action: 'assign',
                        from: null,
                        to: distributorId,
                        assigned_by: 'admin@gmail.com',
                        timestamp: new Date(),
                        level: 'distributor'
                    },
                    {
                        action: 'assign',
                        from: null,
                        to: localDistId,
                        assigned_by: 'distributor@gmail.com',
                        timestamp: new Date(),
                        level: 'local_distributor'
                    }
                ],
                created_by: 'admin@gmail.com',
                created_time: new Date(),
                status: true
            },
            {
                device_id: 'DEV-AQUA-002',
                device_name: 'AquaPure Copper Purifier #2',
                model_id: 'MOD-COPPER-15L',
                bluetooth_mac: 'AA:BB:CC:44:55:66',
                assigned_to: distributorId,
                assigned_to_local: localDistId,
                assigned_by: 'admin@gmail.com',
                assigned_time: new Date(),
                assignment_history: [],
                created_by: 'admin@gmail.com',
                created_time: new Date(),
                status: true
            }
        ];

        for (const dev of sampleDevices) {
            const existing = await db.collection('devices').findOne({ device_id: dev.device_id });
            if (!existing) {
                await db.collection('devices').insertOne(dev);
                console.log(`✓ Seeded Device: ${dev.device_id}`);
            }
        }

        // 7. SEED SAMPLE TASKS FOR SERVICE ENGINEER
        const sampleTasks = [
            {
                task_id: 10001,
                customer_name: 'Anand Sharma',
                address: {
                    doorno: '24/A',
                    street: 'Gandhi Road',
                    city: 'Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600042'
                },
                phone: '+919123456789',
                email: 'customer.anand@gmail.com',
                service_type: 'Installation',
                model_id: 'MOD-RO-UV-2026',
                device_id: 'DEV-AQUA-001',
                device_name: 'AquaPro Smart Purifier #1',
                distributor_id: distributorId,
                local_distributor_id: localDistId,
                assigned_engineer_id: engineerId,
                assigned_engineer_name: 'Karthik Service Engineer',
                assigned_engineer_email: 'engineer@gmail.com',
                assigned_time: new Date(),
                status: 'assigned',
                priority: 'High',
                parts: ['Sediment Filter 5 Micron', 'Pre-Carbon Filter Block'],
                notes: 'New customer installation request at 2nd floor.',
                history: [
                    {
                        status: 'created',
                        timestamp: new Date(),
                        action_by: 'localdist@gmail.com'
                    },
                    {
                        status: 'assigned',
                        timestamp: new Date(),
                        action_by: 'localdist@gmail.com',
                        assigned_to: engineerId
                    }
                ],
                created_by: 'localdist@gmail.com',
                created_time: new Date(),
                modified_by: null,
                modified_time: null
            },
            {
                task_id: 10002,
                customer_name: 'Priya Sundaram',
                address: {
                    doorno: '18',
                    street: 'Anna Salai',
                    city: 'Chennai',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600002'
                },
                phone: '+919988776655',
                email: 'customer.priya@gmail.com',
                service_type: 'Repair',
                model_id: 'MOD-COPPER-15L',
                device_id: 'DEV-AQUA-002',
                device_name: 'AquaPure Copper Purifier #2',
                distributor_id: distributorId,
                local_distributor_id: localDistId,
                assigned_engineer_id: engineerId,
                assigned_engineer_name: 'Karthik Service Engineer',
                assigned_engineer_email: 'engineer@gmail.com',
                assigned_time: new Date(),
                status: 'in_progress',
                priority: 'Medium',
                parts: ['RO Membrane 75 GPD', 'UV Lamp 11W Philips'],
                notes: 'Low flow rate complaint, filter change needed.',
                history: [
                    {
                        status: 'created',
                        timestamp: new Date(),
                        action_by: 'localdist@gmail.com'
                    },
                    {
                        status: 'assigned',
                        timestamp: new Date(),
                        action_by: 'localdist@gmail.com',
                        assigned_to: engineerId
                    },
                    {
                        status: 'in_progress',
                        timestamp: new Date(),
                        action_by: 'engineer@gmail.com'
                    }
                ],
                created_by: 'localdist@gmail.com',
                created_time: new Date(),
                modified_by: null,
                modified_time: null
            }
        ];

        for (const task of sampleTasks) {
            const existing = await db.collection('tasks').findOne({ task_id: task.task_id });
            if (!existing) {
                await db.collection('tasks').insertOne(task);
                console.log(`✓ Seeded Task #${task.task_id} (${task.service_type}) assigned to engineer@gmail.com`);
            }
        }

        console.log('\n========================================');
        console.log(' 🎉 COMPLETE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

module.exports = seedData;
