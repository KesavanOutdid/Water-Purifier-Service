# AQUA Water Purifier Service App - API Integration Guide

## Overview
The app is fully integrated with the backend API at `http://192.168.0.32:5000/`. All screens include proper authentication, token management, and API calls.

---

## Configuration

### .env File
Located at: `service_app/.env`

```
BASE_URL=http://192.168.0.32:5000
API_VERSION=/api/app
LOGIN_ENDPOINT=/auth/login
PROFILE_ENDPOINT=/profile
```

**To update the server URL:**
1. Edit `.env` file
2. Change `BASE_URL` to your server address
3. Restart the app

---

## Authentication Flow

### 1. Onboarding Screen
- **Route**: `/onboarding`
- **Features**: 3-page carousel showcasing app features
- **Actions**: Next/Back buttons, Get Started button

### 2. Login Screen
- **Route**: `/login`
- **Endpoint**: `POST {BASE_URL}{API_VERSION}/auth/login`
- **Fields**:
  - Email address
  - 4-digit PIN (password)
- **Request Body**:
  ```json
  {
    "email": "eng@gmail.com",
    "password": "1234"
  }
  ```
- **Success Response** (Status 200):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "JWT_TOKEN_HERE",
      "user": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@email.com",
        "number": "+1234567890",
        "address": { ... }
      }
    }
  }
  ```
- **Error Handling**:
  - Network errors → "Network error: [error message]"
  - Invalid credentials → Shows error in red box
  - Connection timeout → "Network error: timeout"

### 3. Home Screen
- **Route**: `/home`
- **Features**:
  - Displays user's full name: "Welcome Back, {name}! 👋"
  - Shows status of water purifier
  - Quick action buttons (Book Service, History)
  - Recent services list
  - Animations on load
- **User Data Source**: Loaded from SharedPreferences (stored after login)

### 4. Settings/Profile Screen
- **Route**: `/settings`
- **API Call**: `GET {BASE_URL}{API_VERSION}/profile`
- **Auth Header**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "admin@gmail.com",
      "number": "+1234567890",
      "address": {
        "doorno": "123",
        "street": "Main Street",
        "city": "New York",
        "district": "District",
        "state": "NY",
        "country": "USA",
        "pincode": "10001"
      }
    }
  }
  ```
- **Features**:
  - Profile section with user photo (editable)
  - Auto-loaded profile data from API
  - Edit Profile dialog with all address fields
  - Camera/Gallery picker for profile image
  - Notification preferences
  - Email reminders toggle

### 5. Logout
- **Action**: Clears token and user data from device
- **Next Screen**: Redirects to `/onboarding`
- **Confirmation**: Shows logout confirmation dialog

---

## Token Management

### Token Storage
Tokens are stored securely using `SharedPreferences`:
- **Token Key**: `auth_token`
- **User Key**: `user_data`

### Token Usage
All authenticated API calls automatically include:
```
Authorization: Bearer {token}
```

### Token Persistence
- Tokens are saved after successful login
- Tokens are loaded on app start (AuthGate widget)
- If token exists → Load Home screen
- If no token → Load Onboarding screen
- Tokens are cleared on logout

---

## API Services

### ApiService Class
**Location**: `lib/services/api_service.dart`

**Methods**:
- `login(email, password)` - Login user
- `getProfile()` - Fetch user profile
- `logout()` - Clear authentication
- `isLoggedIn()` - Check if user is authenticated
- `getToken()` - Get current token
- `getUser()` - Get cached user data

### TokenStorage Class
**Location**: `lib/services/token_storage.dart`

**Methods**:
- `saveToken(token)` - Save JWT token
- `getToken()` - Retrieve JWT token
- `clearToken()` - Remove token
- `saveUser(userData)` - Save user details
- `getUser()` - Retrieve user details
- `clearAll()` - Clear all stored data

---

## Screen Navigation Flow

```
AuthGate (Check Auth)
  ├─ If Logged In → Home Screen
  └─ If Not Logged In → Onboarding Screen
      ↓
    Login Screen (with 4-digit PIN)
      ↓
    Login Success Dialog
      ↓
    Home Screen
      ├─ Menu Item: Book Service → Service Screen
      ├─ Menu Item: History → Service History
      └─ Menu Item: Settings → Settings Screen
         ├─ Profile (with API data)
         ├─ Help & Support
         ├─ Privacy Policy
         └─ Logout → Onboarding Screen
```

---

## Testing the API Integration

### Test Credentials
```
Email: eng@gmail.com
PIN: 1234
```

### Manual Testing Steps

1. **Start App**
   - Should show Onboarding if no token stored
   - Should show Home if token exists

2. **Complete Onboarding**
   - Swipe through 3 pages
   - Click "Get Started"
   - Should navigate to Login

3. **Login**
   - Enter test email
   - Enter 4-digit PIN (1234)
   - See loading spinner
   - See success dialog with user name
   - Should navigate to Home

4. **Home Screen**
   - User name should display: "Welcome Back, [name]! 👋"
   - Click "Book Service" → Service Screen
   - Click "History" → Service History
   - Click bottom nav Settings → Settings Screen

5. **Settings Screen**
   - Wait for profile to load (may show spinner)
   - All address fields should be pre-populated
   - Click "Edit Profile" pencil icon
   - Fields should show API data
   - Click camera icon for photo options
   - Click "Logout" → Confirmation → Onboarding

6. **Verify Token Persistence**
   - Login successfully
   - Force close app
   - Reopen app
   - Should show Home directly (no onboarding/login)

---

## Error Handling

### Network Errors
- **Timeout**: After 15 seconds
- **Connection Errors**: Caught and displayed to user
- **Error Message Format**: Red box with error text on Login screen

### API Errors
- **401 Unauthorized**: Invalid token
- **403 Forbidden**: Access denied
- **404 Not Found**: Endpoint not found
- **500 Server Error**: Backend error

### App Errors
- **Token not found**: Forces logout
- **Profile loading fails**: Shows SnackBar message
- **Missing .env**: Uses hardcoded defaults

---

## Customization

### Change API Endpoint
Edit `.env`:
```
BASE_URL=https://your-domain.com:5000
```

### Change API Version
Edit `.env`:
```
API_VERSION=/api/v2
```

### Change Timeout Duration
Edit `lib/services/api_service.dart`:
```dart
.timeout(const Duration(seconds: 15))  // Change 15 to desired seconds
```

### Add More API Endpoints
Add to `.env`:
```
YOUR_ENDPOINT=/your/endpoint
```

Update `ApiService`:
```dart
Future<Map<String, dynamic>> yourMethod() async {
  final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}${dotenv.env['YOUR_ENDPOINT']}';
  // ... implement method
}
```

---

## Dependencies

- **http**: ^1.6.0 (HTTP requests)
- **flutter_dotenv**: ^5.1.0 (.env configuration)
- **shared_preferences**: ^2.5.4 (Token storage)
- **jwt_decoder**: ^2.0.1 (JWT parsing - for future use)
- **google_fonts**: ^6.2.1 (Typography)
- **animations**: ^2.0.11 (Animations)

---

## Troubleshooting

### Issue: "No authentication token found"
**Solution**: User needs to login again

### Issue: Token expires during session
**Solution**: Implement token refresh endpoint and auto-logout on 401

### Issue: Profile doesn't load
**Cause**: 
- Token expired
- Server unavailable
- Wrong endpoint
**Solution**: Check network, verify token, check .env settings

### Issue: 4-digit PIN not working
**Solution**: 
- PIN must be exactly 4 digits
- Leading zeros are allowed (e.g., 0000)
- No special characters

### Issue: App crashes on startup
**Solution**: Ensure .env file exists and is readable

---

## Security Best Practices

✅ **Implemented**:
- JWT tokens stored securely
- Tokens cleared on logout
- Bearer token in Authorization header
- 15-second request timeout

⚠️ **Recommended**:
- Use HTTPS in production
- Implement token refresh
- Add token expiry validation
- Implement password strength validation
- Add rate limiting on login
- Implement biometric authentication

---

## Next Steps

1. **Test with your backend** at `http://192.168.0.32:5000/`
2. **Update .env** with correct API endpoints
3. **Test all auth flows** (login, logout, session persistence)
4. **Implement token refresh** when token expires
5. **Add data sync** for profile updates
6. **Implement service booking API** calls
7. **Add payment integration** if needed

---

## Support

For API documentation, refer to your backend API docs.
For app issues, check the logs in Android Studio / Xcode console.

---

**Last Updated**: December 2024
**Version**: 2.0.0 (API Integrated)
