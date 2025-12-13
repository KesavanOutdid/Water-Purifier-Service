const path = require('path');
const fs = require('fs');

console.log('🔍 Checking Firebase Setup...\n');

const serviceAccountPath = path.join(__dirname, '../firebase-serviceAccountKey.json');

console.log('📁 Looking for: firebase-serviceAccountKey.json');
console.log('📂 Expected path:', serviceAccountPath);
console.log('');

if (fs.existsSync(serviceAccountPath)) {
    console.log('✅ File exists!');
    
    try {
        const serviceAccount = require(serviceAccountPath);
        
        console.log('✅ Valid JSON file');
        console.log('');
        console.log('📋 Firebase Project Info:');
        console.log('   Project ID:', serviceAccount.project_id || 'Not found');
        console.log('   Client Email:', serviceAccount.client_email || 'Not found');
        console.log('   Private Key:', serviceAccount.private_key ? '✅ Present' : '❌ Missing');
        console.log('');
        
        const { isFirebaseInitialized } = require('../config/firebase');
        
        if (isFirebaseInitialized()) {
            console.log('✅ Firebase Admin SDK initialized successfully!');
            console.log('');
            console.log('🎉 Backend is ready to send notifications!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Test with: node scripts/test-notification.js <FCM_TOKEN>');
            console.log('2. Assign task via API to trigger notification');
        } else {
            console.log('⚠️  Firebase not initialized');
            console.log('Check config/firebase.js for errors');
        }
    } catch (error) {
        console.log('❌ Error reading file:', error.message);
        console.log('');
        console.log('Possible issues:');
        console.log('   1. File is not valid JSON');
        console.log('   2. File is corrupted');
        console.log('   3. File permissions issue');
    }
} else {
    console.log('❌ File not found!');
    console.log('');
    console.log('📥 How to get the file:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com');
    console.log('2. Select project: water-servise');
    console.log('3. Click gear icon → Project Settings');
    console.log('4. Go to "Service Accounts" tab');
    console.log('5. Click "Generate new private key"');
    console.log('6. Save the downloaded file as:');
    console.log('   ' + serviceAccountPath);
    console.log('');
    console.log('⚠️  Important: Add this file to .gitignore (already done)');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
