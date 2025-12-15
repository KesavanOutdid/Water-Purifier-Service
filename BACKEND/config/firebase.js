const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

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
            logger.info('Firebase Admin initialized successfully');
        } else {
            logger.warn('Firebase service account key not found. Push notifications will be disabled.');
        }
    } catch (error) {
        logger.error('Firebase initialization error:', error.message);
    }
};

initializeFirebase();

const sendNotification = async (fcmToken, title, body, data = {}) => {
    if (!firebaseInitialized) {
        logger.warn('Firebase not initialized. Skipping notification.');
        return null;
    }

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 50) {
        logger.warn('Invalid or missing FCM token. Skipping notification.', fcmToken ? `Token: ${fcmToken.substring(0, 20)}... (length: ${fcmToken.length})` : 'Token is null/undefined');
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
        logger.info('Notification sent successfully:', response);
        return response;
    } catch (error) {
        logger.error('[FCM] Notification send failed:', error.message);
        
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
            logger.info('[FCM] Invalid token detected - should be removed from database');
        }
        
        return null;
    }
};

const sendMultipleNotifications = async (fcmTokens, title, body, data = {}) => {
    if (!firebaseInitialized) {
        logger.warn('Firebase not initialized. Skipping notifications.');
        return null;
    }

    if (!fcmTokens || fcmTokens.length === 0) {
        logger.warn('No FCM tokens provided. Skipping notifications.');
        return null;
    }

    const validTokens = fcmTokens.filter(token => token && token.trim() !== '');

    if (validTokens.length === 0) {
        logger.warn('No valid FCM tokens. Skipping notifications.');
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
        logger.info(`Successfully sent ${response.successCount} of ${validTokens.length} notifications`);
        
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    logger.error(`Failed to send to token ${idx}:`, resp.error.message);
                }
            });
        }
        
        return response;
    } catch (error) {
        logger.error('Error sending multiple notifications:', error.message);
        return null;
    }
};

module.exports = { 
    sendNotification, 
    sendMultipleNotifications,
    isFirebaseInitialized: () => firebaseInitialized
};
