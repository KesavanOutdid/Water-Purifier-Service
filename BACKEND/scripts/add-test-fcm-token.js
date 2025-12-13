const { getDB, connectDB } = require('../config/database');

const addTestToken = async () => {
    console.log('🔧 Adding test FCM token to engineer...\n');
    
    const engineerId = '4a86fd2f-3092-4c55-84f8-780d37d74c00';
    const testToken = 'test_token_for_sai_santhan_engineer';
    
    try {
        await connectDB();
        const db = getDB();
        
        const result = await db.collection('users').updateOne(
            { user_id: engineerId },
            { 
                $set: { 
                    fcm_token: testToken,
                    fcm_token_updated_at: new Date()
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ FCM token added successfully!');
        } else {
            console.log('ℹ️  Token already exists or user not found');
        }
        
        const user = await db.collection('users').findOne({ user_id: engineerId });
        
        if (user) {
            console.log('\n👤 Engineer Details:');
            console.log('   Name:', user.name);
            console.log('   Email:', user.email);
            console.log('   FCM Token:', user.fcm_token || 'Not set');
            console.log('\n✅ Ready to test notifications!');
            console.log('\nNext: Assign a task to this engineer via API or admin panel');
        } else {
            console.log('❌ Engineer not found!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

addTestToken();
