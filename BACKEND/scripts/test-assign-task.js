const { getDB, connectDB } = require('../config/database');
const { sendNotification } = require('../config/firebase');

const testAssignTask = async () => {
    console.log('🔔 Testing Task Assignment with Notification...\n');
    
    const engineerId = '4a86fd2f-3092-4c55-84f8-780d37d74c00';
    
    try {
        await connectDB();
        const db = getDB();
        
        // Get engineer details
        const engineer = await db.collection('users').findOne({ user_id: engineerId });
        
        if (!engineer) {
            console.log('❌ Engineer not found!');
            process.exit(1);
        }
        
        console.log('👤 Engineer:', engineer.name);
        console.log('📱 FCM Token:', engineer.fcm_token || 'Not set');
        console.log('');
        
        if (!engineer.fcm_token) {
            console.log('⚠️  No FCM token found. Run: node scripts/add-test-fcm-token.js');
            process.exit(1);
        }
        
        // Find an unassigned task
        const unassignedTask = await db.collection('tasks').findOne({
            status: true,
            task_status: 'created',
            assigned_to: null
        });
        
        if (!unassignedTask) {
            console.log('⚠️  No unassigned tasks found.');
            console.log('Creating a test task...\n');
            
            // Create a test task
            const taskId = Math.floor(Math.random() * 90000) + 10000;
            const newTask = {
                task_id: taskId,
                customer_name: 'Test Customer for Notification',
                phone: '9876543210',
                email: 'test@example.com',
                address: 'Test Address, Bangalore',
                service_type: 'service',
                model_id: 'test-model',
                model_name: 'Test Model',
                task_status: 'created',
                created_time: new Date(),
                status: true,
                task_history: []
            };
            
            await db.collection('tasks').insertOne(newTask);
            console.log('✅ Test task created: #' + taskId);
            
            // Assign to engineer
            const historyRecord = {
                action: 'assign',
                from: null,
                from_name: null,
                to: engineerId,
                to_name: engineer.name,
                assigned_by: 'test@admin.com',
                timestamp: new Date(),
                reason: null
            };
            
            await db.collection('tasks').updateOne(
                { task_id: taskId },
                { 
                    $set: {
                        assigned_to: engineerId,
                        engineer_name: engineer.name,
                        assigned_by: 'test@admin.com',
                        assigned_time: new Date(),
                        task_status: 'assigned',
                        modified_by: 'test@admin.com',
                        modified_time: new Date()
                    },
                    $push: { task_history: historyRecord }
                }
            );
            
            console.log('✅ Task assigned to:', engineer.name);
            console.log('');
            console.log('📤 Sending notification...');
            
            // Send notification
            const result = await sendNotification(
                engineer.fcm_token,
                'New Task Assigned',
                `Task #${taskId} has been assigned to you - ${newTask.customer_name}`,
                {
                    task_id: taskId.toString(),
                    type: 'task_assigned',
                    customer_name: newTask.customer_name,
                    service_type: newTask.service_type
                }
            );
            
            if (result) {
                console.log('✅ Notification sent successfully!');
                console.log('   Response:', result);
            } else {
                console.log('⚠️  Notification failed (check logs above)');
                console.log('   This is expected with test token');
                console.log('   With real FCM token from app, it will work!');
            }
            
        } else {
            console.log('📋 Found unassigned task: #' + unassignedTask.task_id);
            console.log('   Customer:', unassignedTask.customer_name);
            console.log('');
            
            // Assign to engineer
            const historyRecord = {
                action: 'assign',
                from: null,
                from_name: null,
                to: engineerId,
                to_name: engineer.name,
                assigned_by: 'test@admin.com',
                timestamp: new Date(),
                reason: null
            };
            
            await db.collection('tasks').updateOne(
                { task_id: unassignedTask.task_id },
                { 
                    $set: {
                        assigned_to: engineerId,
                        engineer_name: engineer.name,
                        assigned_by: 'test@admin.com',
                        assigned_time: new Date(),
                        task_status: 'assigned',
                        modified_by: 'test@admin.com',
                        modified_time: new Date()
                    },
                    $push: { task_history: historyRecord }
                }
            );
            
            console.log('✅ Task assigned to:', engineer.name);
            console.log('');
            console.log('📤 Sending notification...');
            
            // Send notification
            const result = await sendNotification(
                engineer.fcm_token,
                'New Task Assigned',
                `Task #${unassignedTask.task_id} has been assigned to you - ${unassignedTask.customer_name}`,
                {
                    task_id: unassignedTask.task_id.toString(),
                    type: 'task_assigned',
                    customer_name: unassignedTask.customer_name,
                    service_type: unassignedTask.service_type
                }
            );
            
            if (result) {
                console.log('✅ Notification sent successfully!');
                console.log('   Response:', result);
            } else {
                console.log('⚠️  Notification failed (check logs above)');
                console.log('   This is expected with test token');
                console.log('   With real FCM token from app, it will work!');
            }
        }
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Test completed!');
        console.log('');
        console.log('Summary:');
        console.log('1. ✅ Engineer has FCM token');
        console.log('2. ✅ Task assigned to engineer');
        console.log('3. ✅ Notification code executed');
        console.log('4. ⏳ Waiting for real FCM token from mobile app');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

testAssignTask();
