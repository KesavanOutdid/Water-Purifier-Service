const { sendNotification } = require('../config/firebase');

const testNotification = async () => {
    console.log('🔔 Testing Firebase Notification...\n');

    const testToken = process.argv[2];
    
    if (!testToken) {
        console.error('❌ Error: FCM token is required');
        console.log('\nUsage: node scripts/test-notification.js <FCM_TOKEN>');
        console.log('\nTo get a test FCM token:');
        console.log('1. Install Firebase Messaging in a test app');
        console.log('2. Or use Firebase Console → Cloud Messaging → Send test message');
        process.exit(1);
    }

    try {
        console.log('📱 Sending notification to token:', testToken.substring(0, 20) + '...\n');
        
        const result = await sendNotification(
            testToken,
            'Test Notification',
            'This is a test notification from Water Purifier Service backend',
            {
                task_id: '12345',
                type: 'test',
                customer_name: 'Test Customer'
            }
        );

        if (result) {
            console.log('✅ Notification sent successfully!');
            console.log('Response:', result);
        } else {
            console.log('⚠️  Notification failed. Check if:');
            console.log('   1. firebase-serviceAccountKey.json is in BACKEND folder');
            console.log('   2. FCM token is valid');
            console.log('   3. App is properly registered in Firebase');
        }
    } catch (error) {
        console.error('❌ Error sending notification:', error.message);
        console.error('\nPossible issues:');
        console.error('   1. firebase-serviceAccountKey.json not found');
        console.error('   2. Invalid FCM token');
        console.error('   3. Firebase project misconfigured');
    }
};

testNotification();
