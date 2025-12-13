import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../firebase_options.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('🔔 Background message received: ${message.messageId}');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
}

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  static bool _initialized = false;

  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  Future<void> initializeFirebase() async {
    if (_initialized) {
      print('✅ Firebase already initialized');
      return;
    }

    try {
      print('🔥 Initializing Firebase...');

      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );

      _initialized = true;
      print('✅ Firebase initialized successfully');

      await _setupFCMHandlers();
      await _requestNotificationPermission();

      print('✅ FCM setup complete');
    } catch (e) {
      print('❌ Firebase initialization error: $e');
      _initialized = false;
      rethrow;
    }
  }

  Future<void> _setupFCMHandlers() async {
    try {
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('🔔 Foreground message received: ${message.messageId}');
        print('Title: ${message.notification?.title}');
        print('Body: ${message.notification?.body}');
        print('Data: ${message.data}');

        _handleForegroundMessage(message);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('📱 Message opened from notification: ${message.messageId}');
        _handleMessageOpened(message);
      });
    } catch (e) {
      print('⚠️ Error setting up FCM handlers: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification != null) {
      print('Title: ${notification.title}');
      print('Body: ${notification.body}');
    }
  }

  void _handleMessageOpened(RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;

    print('Message data: $data');

    if (data.containsKey('taskId')) {
      print('Navigating to task: ${data['taskId']}');
    } else if (data.containsKey('screen')) {
      print('Navigating to screen: ${data['screen']}');
    }
  }

  Future<void> _requestNotificationPermission() async {
    try {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('✅ Notification permission granted');
      } else if (settings.authorizationStatus ==
          AuthorizationStatus.provisional) {
        print('⚠️ Provisional notification permission granted');
      } else {
        print('❌ Notification permission denied');
      }
    } catch (e) {
      print('⚠️ Error requesting notification permission: $e');
    }
  }

  Future<String?> getFCMToken() async {
    if (!_initialized) {
      print('⚠️ Firebase not initialized. Cannot get FCM token');
      return null;
    }

    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        print('✅ FCM Token obtained: $token');
      } else {
        print('⚠️ FCM Token is null');
      }
      return token;
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }

  Future<void> deleteToken() async {
    try {
      await _firebaseMessaging.deleteToken();
      print('✅ FCM token deleted');
    } catch (e) {
      print('❌ Error deleting FCM token: $e');
    }
  }

  void listenToTokenRefresh(Function(String) onTokenRefresh) {
    try {
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 FCM token refreshed: $newToken');
        onTokenRefresh(newToken);
      });
    } catch (e) {
      print('⚠️ Error listening to token refresh: $e');
    }
  }

  bool isInitialized() {
    return _initialized;
  }
}
