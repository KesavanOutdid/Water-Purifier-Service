# Firebase Push Notification Setup - Frontend Guide

## Overview
This guide explains how to integrate Firebase Cloud Messaging (FCM) in the Flutter app to receive push notifications when tasks are assigned or reassigned.

---

## 📋 Prerequisites
- Flutter project ready
- `google-services.json` file (already provided in project root)

---

## 🔧 Setup Steps

### 1. Move `google-services.json` to Flutter Project

**Copy the file from project root to:**
```
FRONTEND/App/android/app/google-services.json
```

**Command:**
```bash
copy google-services.json FRONTEND\App\android\app\google-services.json
```

---

### 2. Update Flutter Dependencies

**Add to `pubspec.yaml`:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase dependencies
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  
  # Optional: For local notifications
  flutter_local_notifications: ^16.3.0
```

**Run:**
```bash
flutter pub get
```

---

### 3. Update Android Gradle Files

#### **File: `android/build.gradle`**

Add Google Services plugin:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath 'com.android.tools.build:gradle:7.3.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        classpath 'com.google.gms:google-services:4.4.0'  // Add this line
    }
}
```

#### **File: `android/app/build.gradle`**

At the **bottom** of the file, add:

```gradle
apply plugin: 'com.google.gms.google-services'  // Add this line
```

---

### 4. Update Android Manifest

**File: `android/app/src/main/AndroidManifest.xml`**

Add permissions and notification metadata:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Add permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application
        android:label="Water Purifier Service"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            ...>
            ...
        </activity>
        
        <!-- Add notification metadata -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="task_notifications" />
            
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
            
    </application>
</manifest>
```

---

### 5. Initialize Firebase in Flutter

**File: `lib/main.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Register background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Water Purifier Service',
      home: HomePage(),
    );
  }
}
```

---

### 6. Create Firebase Service Class

**File: `lib/services/firebase_service.dart`**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission for iOS
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    print('Notification permission granted: ${settings.authorizationStatus}');

    // Initialize local notifications
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initSettings =
        InitializationSettings(android: androidSettings);
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'task_notifications',
      'Task Notifications',
      description: 'Notifications for task assignments',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    RemoteMessage? initialMessage = 
        await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  Future<String?> getToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');
    
    // Show local notification when app is in foreground
    _showLocalNotification(message);
  }

  void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.data}');
    
    // Navigate to task detail screen
    String? taskId = message.data['task_id'];
    String? type = message.data['type'];
    
    // TODO: Navigate to appropriate screen
    // Example: Navigator.push(...);
  }

  void _onNotificationTap(NotificationResponse response) {
    print('Local notification tapped: ${response.payload}');
    
    // TODO: Handle tap on local notification
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = 
        AndroidNotificationDetails(
      'task_notifications',
      'Task Notifications',
      channelDescription: 'Notifications for task assignments',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const NotificationDetails details = 
        NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      details,
      payload: message.data.toString(),
    );
  }
}
```

---

### 7. Update Login API Call

**Send FCM token to backend during login:**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import './firebase_service.dart';

class AuthService {
  final FirebaseService _firebaseService = FirebaseService();

  Future<void> login(String email, String password) async {
    try {
      // Get FCM token
      String? fcmToken = await _firebaseService.getToken();
      
      // Send to backend
      final response = await http.post(
        Uri.parse('YOUR_API_URL/api/app/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'fcm_token': fcmToken,  // Send token to backend
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Save token, navigate to home, etc.
      }
    } catch (e) {
      print('Login error: $e');
    }
  }
}
```

---

### 8. Initialize Firebase Service

**In your main widget or home screen:**

```dart
import './services/firebase_service.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final FirebaseService _firebaseService = FirebaseService();

  @override
  void initState() {
    super.initState();
    _initializeFirebase();
  }

  Future<void> _initializeFirebase() async {
    await _firebaseService.initialize();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Center(child: Text('Welcome!')),
    );
  }
}
```

---

## 📱 Notification Data Structure

### When Task is Assigned:
```json
{
  "notification": {
    "title": "New Task Assigned",
    "body": "Task #70256 has been assigned to you - John Doe"
  },
  "data": {
    "task_id": "70256",
    "type": "task_assigned",
    "customer_name": "John Doe",
    "service_type": "installation"
  }
}
```

### When Task is Reassigned:
```json
{
  "notification": {
    "title": "Task Reassigned to You",
    "body": "Task #70256 has been reassigned to you - John Doe"
  },
  "data": {
    "task_id": "70256",
    "type": "task_reassigned",
    "customer_name": "John Doe",
    "service_type": "service",
    "previous_engineer": "Mike Smith"
  }
}
```

---

## 🧪 Testing

### 1. Test from Firebase Console:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Add your FCM token
4. Send notification

### 2. Test from Backend:

Assign a task to an engineer through admin panel. The engineer should receive notification.

---

## ✅ Checklist

- [ ] Move `google-services.json` to `android/app/`
- [ ] Add Firebase dependencies to `pubspec.yaml`
- [ ] Update `android/build.gradle`
- [ ] Update `android/app/build.gradle`
- [ ] Update `AndroidManifest.xml`
- [ ] Initialize Firebase in `main.dart`
- [ ] Create `FirebaseService` class
- [ ] Send FCM token during login
- [ ] Test notifications

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console for app registration
2. Verify package name matches: `com.waterpurifier.service`
3. Check logs for FCM token generation
4. Ensure permissions are granted on device

---

## 🔗 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging/flutter/client)
- [Flutter Local Notifications](https://pub.dev/packages/flutter_local_notifications)
- [Firebase Messaging Package](https://pub.dev/packages/firebase_messaging)
