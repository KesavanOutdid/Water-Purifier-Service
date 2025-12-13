const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

const initializeFirebase = () => {
    if (firebaseInitialized) {
        return;
    }

    try {
        const serviceAccountPath = path.join(__dirname, '../firebase-serviceAccountKey.json');
        
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            
            firebaseInitialized = true;
            console.log('Firebase Admin initialized successfully');
        } else {
            console.warn('Firebase service account key not found. Push notifications will be disabled.');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error.message);
    }
};

initializeFirebase();

const sendNotification = async (fcmToken, title, body, data = {}) => {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Skipping notification.');
        return null;
    }

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 50) {
        console.warn('Invalid or missing FCM token. Skipping notification.', fcmToken ? `Token: ${fcmToken.substring(0, 20)}... (length: ${fcmToken.length})` : 'Token is null/undefined');
        return null;
    }

    try {
        const stringData = {};
        for (const key in data) {
            stringData[key] = String(data[key]);
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: stringData,
            token: fcmToken,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'task_notifications'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('Notification sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending notification:', error.message);
        
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
            console.log('Invalid FCM token, should be removed from database');
        }
        
        return null;
    }
};

const sendMultipleNotifications = async (fcmTokens, title, body, data = {}) => {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Skipping notifications.');
        return null;
    }

    if (!fcmTokens || fcmTokens.length === 0) {
        console.warn('No FCM tokens provided. Skipping notifications.');
        return null;
    }

    const validTokens = fcmTokens.filter(token => token && token.trim() !== '');

    if (validTokens.length === 0) {
        console.warn('No valid FCM tokens. Skipping notifications.');
        return null;
    }

    try {
        const stringData = {};
        for (const key in data) {
            stringData[key] = String(data[key]);
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: stringData,
            tokens: validTokens,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'task_notifications'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`Successfully sent ${response.successCount} of ${validTokens.length} notifications`);
        
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send to token ${idx}:`, resp.error.message);
                }
            });
        }
        
        return response;
    } catch (error) {
        console.error('Error sending multiple notifications:', error.message);
        return null;
    }
};

module.exports = { 
    sendNotification, 
    sendMultipleNotifications,
    isFirebaseInitialized: () => firebaseInitialized
};
