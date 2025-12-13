# AQUA Water Purifier Service App - Installation & Feature Guide

## Overview
AQUA is a modern Flutter application for water purifier service management with a beautiful water blue theme, smooth animations, and comprehensive user interface.

## Features

### 🎨 UI/UX Features
- **Water Blue Theme**: Professional gradient colors inspired by water
- **Smooth Animations**: Fade, slide, scale, and wave animations throughout the app
- **Responsive Design**: Works seamlessly on all device sizes
- **Modern Material Design**: Following Flutter Material 3 guidelines
- **Custom Widgets**: Reusable components for consistency

### 📱 Screen Features

#### 1. **Splash/Welcome Screen**
- Animated logo with scaling effect
- Wave animation at the bottom
- Smooth fade and slide transitions
- Get Started button to navigate to login

#### 2. **Login Screen**
- Email and password input fields
- Password visibility toggle
- Remember me checkbox
- Forgot password link
- Sign up link for new users
- Login success dialog with animation
- Simulated 2-second login process

#### 3. **Home Screen**
- Welcome card with device status
- Quick action buttons (Book Service, History)
- Recent services list with animations
- Bottom navigation bar for easy navigation
- Service status indicators with color coding
- Next service date reminder

#### 4. **Service Booking Screen**
- Device selector with horizontal scroll
- Service type grid with icons (Maintenance, Repair, Replacement, Installation)
- Date picker for scheduling
- Description textarea
- Booking confirmation dialog
- Visual feedback for selections

#### 5. **Service History Screen**
- Filter services by status (All, Pending, Scheduled, In Progress, Completed, Cancelled)
- Status badge with color coding
- Service details modal on tap
- Cost display
- Technician information
- Service ratings

#### 6. **Settings/Profile Screen**
- User profile card with gradient background
- Edit profile functionality
- Notification settings toggle
- Email reminder settings toggle
- About section
- Help & Support
- Privacy Policy link
- Logout with confirmation

#### 7. **Privacy Policy Screen**
- Professional privacy policy text
- Last updated information
- Clear visual hierarchy

## Installation

### Prerequisites
- Flutter SDK (3.10.3 or higher)
- Dart SDK
- iOS/Android development tools (optional for running on devices)

### Steps

1. **Navigate to project directory**
   ```bash
   cd FRONTEND/App/service_app
   ```

2. **Get dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the app**
   ```bash
   flutter run
   ```

4. **Build for release (optional)**
   ```bash
   # Android
   flutter build apk
   
   # iOS
   flutter build ios
   ```

## Project Structure

```
lib/
├── main.dart                 # App entry point and routing
├── themes/
│   └── app_theme.dart       # Custom theme with water blue colors
├── screens/
│   ├── splash_screen.dart       # Welcome/splash screen
│   ├── login_screen.dart        # Login screen
│   ├── home_screen.dart         # Main home screen
│   ├── service_screen.dart      # Service booking
│   ├── service_history_screen.dart  # Service history
│   ├── settings_screen.dart     # Settings/profile
│   └── privacy_policy_screen.dart   # Privacy policy
├── models/
│   ├── user_model.dart      # User data model
│   └── service_model.dart   # Service data model
├── widgets/
│   ├── custom_button.dart   # Reusable button widget
│   └── service_card.dart    # Service list card widget
└── utils/
    └── constants.dart       # App constants and text
```

## Dependencies

- **flutter_animate**: Advanced animations
- **animations**: Material animations
- **google_fonts**: Custom typography
- **lottie**: Lottie animations support
- **get**: State management and routing
- **http**: HTTP requests
- **shared_preferences**: Local storage
- **firebase_core**: Firebase integration
- And more... (see pubspec.yaml)

## Color Scheme

- **Primary**: #1BA0C8 (Water Blue)
- **Primary Dark**: #0D7FA8
- **Primary Light**: #B3E5FC
- **Accent**: #00ACC1
- **Background**: #F0F9FF
- **Success**: #4CAF50
- **Error**: #E53935
- **Warning**: #FDD835

## Animation Features

1. **Splash Screen**
   - Logo scale and fade-in
   - Wave animation at bottom
   - Text slide-in animation

2. **Login Screen**
   - Page fade and slide animation
   - Button press scale animation
   - Success dialog scale animation

3. **Home Screen**
   - Card slide-in animations
   - Staggered list animations
   - Status card animations

4. **Service Screens**
   - Device selector smooth transitions
   - Service type grid selection animation
   - Dialog animations with scale effects

5. **Settings Screen**
   - Profile card slide-in
   - Settings list animations
   - Logout button slide animation

## User Flow

```
Splash Screen
    ↓
Login Screen → (Success) → Home Screen
                              ↓
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
        Book Service   Service History    Settings
            ↓                 ↓                 ↓
        Book & Confirm   View Details   Edit Profile
                                        View Privacy
                                        Logout
```

## Customization

### Change Theme Colors
Edit `lib/themes/app_theme.dart` and modify the color constants:
```dart
static const Color primaryColor = Color(0xFF1BA0C8);
```

### Add Custom Fonts
1. Add fonts to `pubspec.yaml`
2. Update font references in `app_theme.dart`

### Modify Service Types
Edit `lib/models/service_model.dart` to add/remove service types:
```dart
enum ServiceType { maintenance, repair, replacement, installation }
```

## Testing Features

1. **Login Test**: Use any email/password combination
2. **Service Booking**: Try booking different service types and dates
3. **Service History**: Filter services by status to see the filtering feature
4. **Settings**: Test profile editing and notification toggles
5. **Navigation**: Use bottom navigation bar and back buttons

## Performance Tips

- The app uses proper animation controllers and disposal
- Memory-efficient image loading
- Optimized list views with physics settings
- Proper route management to prevent memory leaks

## Future Enhancements

- Integration with backend API
- Real-time service tracking
- Payment gateway integration
- Push notifications
- User reviews and ratings
- Map integration for service locations
- Multiple language support

## Support

For issues or questions, contact: support@aquawater.com

## License

This project is private and proprietary to AQUA Water Purifier Services.
