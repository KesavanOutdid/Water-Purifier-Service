import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'dart:io' show Platform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (Platform.isAndroid) {
      return android;
    }
    if (Platform.isIOS) {
      return ios;
    }
    throw UnsupportedError(
      'DefaultFirebaseOptions are not supported for this platform.',
    );
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyATnipcIKehau08A6aHjGOXt62s8szg7Nc',
    appId: '1:1015589508308:android:6a4df9bf9aecd8dae9d741',
    messagingSenderId: '1015589508308',
    projectId: 'water-servise',
    storageBucket: 'water-servise.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyATnipcIKehau08A6aHjGOXt62s8szg7Nc',
    appId: '1:1015589508308:ios:6a4df9bf9aecd8dae9d741',
    messagingSenderId: '1015589508308',
    projectId: 'water-servise',
    storageBucket: 'water-servise.firebasestorage.app',
    iosBundleId: 'com.aqua.service_app',
  );
}
