# Backend Notification Testing Guide

## Prerequisites

1. Firebase service account key file must be in: `BACKEND/firebase-serviceAccountKey.json`
2. Backend server should be running
3. MongoDB should be running

---

## Method 1: Test Script (Easiest)

### Step 1: Get a test FCM token

**Option A: Use existing mobile app**
- Install any FCM-enabled app
- Get token from app logs
- Or use a test Flutter app

**Option B: Use Firebase Console**
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Generate a test token

**Option C: Temporary test token**
For initial testing, you can use a dummy token (notification will fail but you can verify backend code works):
```
eL3Zv8xK9mN2pQwR5tY6uI7oP8aS9dF0gH1jK2lM3nB4vC5xZ6
```

### Step 2: Run test script

```bash
cd BACKEND
node scripts/test-notification.js <YOUR_FCM_TOKEN>
```

**Example:**
```bash
node scripts/test-notification.js eL3Zv8xK9mN2pQwR5tY6uI7oP8aS9dF0gH1jK2lM3nB4vC5xZ6
```

**Expected Output:**
```
🔔 Testing Firebase Notification...

📱 Sending notification to token: eL3Zv8xK9mN2pQwR5...

✅ Notification sent successfully!
Response: projects/water-servise/messages/0:1234567890123456
```

---

## Method 2: Test via API (Real Scenario)

### Step 1: Add FCM token to a test engineer

**Using MongoDB Shell:**
```javascript
db.users.updateOne(
  { email: "engineer@example.com" },
  { 
    $set: { 
      fcm_token: "YOUR_TEST_FCM_TOKEN",
      fcm_token_updated_at: new Date()
    } 
  }
)
```

**Or use Postman/Thunder Client:**
```http
PATCH http://localhost:5000/api/admin/users/engineer_user_id
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "fcm_token": "YOUR_TEST_FCM_TOKEN",
  "modified_by": "admin@example.com"
}
```

### Step 2: Assign a task to trigger notification

**Using Postman:**
```http
POST http://localhost:5000/api/admin/tasks/70256/assign
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "engineer_id": "engineer_user_id",
  "assigned_by": "admin@example.com"
}
```

### Step 3: Check backend logs

You should see:
```
Notification sent successfully: projects/water-servise/messages/...
```

---

## Method 3: Simulated Login Test

### Create a test endpoint (temporary)

**File: `BACKEND/routes/testRoutes.js`** (create this)

```javascript
const express = require('express');
const router = express.Router();
const { sendNotification } = require('../config/firebase');

router.post('/test-notification', async (req, res) => {
    try {
        const { fcm_token } = req.body;
        
        if (!fcm_token) {
            return res.status(400).json({
                success: false,
                message: 'fcm_token is required'
            });
        }

        const result = await sendNotification(
            fcm_token,
            'Test Notification',
            'Backend notification system is working!',
            {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        );

        res.json({
            success: true,
            message: 'Notification sent',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending notification',
            error: error.message
        });
    }
});

module.exports = router;
```

**Add to `app.js`:**
```javascript
const testRoutes = require('./routes/testRoutes');
app.use('/api/test', testRoutes);
```

**Test with curl:**
```bash
curl -X POST http://localhost:5000/api/test/test-notification \
  -H "Content-Type: application/json" \
  -d '{"fcm_token": "YOUR_TEST_TOKEN"}'
```

---

## Method 4: Frontend Simulation (Before Real App)

### Create simple test HTML page

**File: `BACKEND/public/test-notification.html`**

```html
<!DOCTYPE html>
<html>
<head>
    <title>FCM Test</title>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>
</head>
<body>
    <h1>Firebase Notification Test</h1>
    <button onclick="getToken()">Get FCM Token</button>
    <button onclick="testLogin()">Test Login with Token</button>
    <p id="token">Token will appear here...</p>
    <p id="result"></p>

    <script>
        const firebaseConfig = {
            apiKey: "AIzaSyATnipcIKehau08A6aHjGOXt62s8szg7Nc",
            projectId: "water-servise",
            messagingSenderId: "1015589508308",
            appId: "1:1015589508308:android:6a4df9bf9aecd8dae9d741"
        };

        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        let currentToken = '';

        async function getToken() {
            try {
                const token = await messaging.getToken({
                    vapidKey: 'YOUR_VAPID_KEY' // Get from Firebase Console
                });
                currentToken = token;
                document.getElementById('token').innerText = 'Token: ' + token;
                console.log('FCM Token:', token);
            } catch (error) {
                document.getElementById('token').innerText = 'Error: ' + error.message;
            }
        }

        async function testLogin() {
            if (!currentToken) {
                alert('Get FCM token first!');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/app/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'engineer@example.com',
                        password: 'password123',
                        fcm_token: currentToken
                    })
                });

                const data = await response.json();
                document.getElementById('result').innerText = 
                    'Login Result: ' + JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').innerText = 'Error: ' + error.message;
            }
        }

        // Listen for messages
        messaging.onMessage((payload) => {
            console.log('Message received:', payload);
            alert('Notification: ' + payload.notification.title);
        });
    </script>
</body>
</html>
```

---

## Method 5: Check Backend Setup (Without Sending)

### Verify Firebase initialization

**Create: `BACKEND/scripts/check-firebase.js`**

```javascript
const { isFirebaseInitialized } = require('../config/firebase');

console.log('Firebase Initialization Status:', isFirebaseInitialized());

if (isFirebaseInitialized()) {
    console.log('✅ Firebase is ready to send notifications');
} else {
    console.log('❌ Firebase not initialized. Check:');
    console.log('   1. firebase-serviceAccountKey.json exists');
    console.log('   2. File is valid JSON');
    console.log('   3. Path is correct');
}
```

**Run:**
```bash
node scripts/check-firebase.js
```

---

## Troubleshooting

### Issue: "Firebase not initialized"

**Solution:**
1. Ensure `firebase-serviceAccountKey.json` exists in `BACKEND/` folder
2. Download from Firebase Console → Project Settings → Service Accounts
3. Click "Generate new private key"

### Issue: "Invalid registration token"

**Solution:**
1. FCM token might be expired or invalid
2. Generate new token from mobile app
3. Ensure app is properly registered with package name: `com.waterpurifier.service`

### Issue: "Requested entity was not found"

**Solution:**
1. Check that Firebase project ID matches
2. Verify service account key is from correct project
3. Ensure app is registered in Firebase Console

### Issue: Notification not received

**Checklist:**
- [ ] Firebase service account key is valid
- [ ] FCM token is current and valid
- [ ] App is running on device/emulator
- [ ] Notification permission granted
- [ ] Internet connection available
- [ ] Firebase project ID matches

---

## Verification Checklist

- [ ] Firebase service account key downloaded
- [ ] File placed at `BACKEND/firebase-serviceAccountKey.json`
- [ ] Test script runs without errors
- [ ] Backend logs show "Firebase Admin initialized successfully"
- [ ] API endpoints accept fcm_token parameter
- [ ] Engineer has valid FCM token in database
- [ ] Task assignment triggers notification code
- [ ] No errors in backend logs

---

## Expected Flow

1. **Engineer logs in** → FCM token saved to database
2. **Admin assigns task** → Backend triggers notification
3. **Notification sent** → Firebase sends to device
4. **Engineer receives** → App shows notification
5. **Engineer taps** → Opens task details

---

## Quick Test Commands

```bash
# Check Firebase initialization
node scripts/check-firebase.js

# Test with dummy token
node scripts/test-notification.js eL3Zv8xK9mN2pQwR5tY6uI7oP8aS9dF0gH1jK2lM3nB4vC5xZ6

# Check MongoDB for FCM tokens
mongo
use your_database
db.users.find({ fcm_token: { $exists: true } })
```

---

## Production Monitoring

Add logging to track notification success:

```javascript
// In firebase.js
console.log(`[${new Date().toISOString()}] Notification sent to ${fcmToken.substring(0, 10)}...`);
```

Monitor logs for:
- Notification send attempts
- Success/failure rates
- Invalid token errors
- Firebase connection issues

---

## Next Steps

1. ✅ Test backend with test script
2. ✅ Verify Firebase initialization
3. ✅ Test API endpoints
4. ⏳ Wait for frontend to implement FCM
5. ⏳ Test end-to-end with real mobile app
