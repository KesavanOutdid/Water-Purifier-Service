import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/service_model.dart';
import 'token_storage.dart';

class ApiService {
  late String baseUrl;
  late String apiVersion;

  ApiService() {
    baseUrl = dotenv.env['BASE_URL'] ?? 'http://192.168.0.18:5001';
    apiVersion = dotenv.env['API_VERSION'] ?? '/api/app';
  }

  void _logRequest(String method, String endpoint, {Map<String, dynamic>? body}) {
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    print('📤 API REQUEST');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    print('Method: $method');
    print('Endpoint: $endpoint');
    if (body != null) {
      print('Body: ${jsonEncode(body)}');
    }
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  void _logResponse(String status, dynamic response) {
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    print('📥 API RESPONSE - $status');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (response is String) {
      print(response);
    } else {
      print(jsonEncode(response));
    }
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  void _logError(String error) {
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    print('❌ API ERROR');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    print('Error: $error');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? fcmToken,
    Map<String, dynamic>? deviceInfo,
  }) async {
    try {
      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}${dotenv.env['LOGIN_ENDPOINT']}';
      
      final body = <String, dynamic>{
        'email': email,
        'password': password,
      };

      if (fcmToken != null && fcmToken.isNotEmpty) {
        body['fcmToken'] = fcmToken;
      }

      if (deviceInfo != null) {
        body['deviceInfo'] = deviceInfo;
      }

      final logBody = <String, dynamic>{
        'email': email,
        'password': '***',
      };
      if (fcmToken != null && fcmToken.isNotEmpty) {
        logBody['fcmToken'] = fcmToken;
      }
      if (deviceInfo != null) {
        logBody['deviceInfo'] = deviceInfo;
      }
      _logRequest('POST', endpoint, body: logBody);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        if (result['data']['token'] != null) {
          await TokenStorage.saveToken(result['data']['token']);
          await TokenStorage.saveUser(result['data']['user']);
        }
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Login failed');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}${dotenv.env['PROFILE_ENDPOINT']}';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        await TokenStorage.saveUser(result['data']);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch profile');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> logout({
    String? fcmToken,
    String? deviceId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/auth/logout';
      
      final body = <String, dynamic>{};
      
      if (fcmToken != null && fcmToken.isNotEmpty) {
        body['fcm_token'] = fcmToken;
      }
      
      if (deviceId != null && deviceId.isNotEmpty) {
        body['deviceId'] = deviceId;
      }
      
      print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      print('📤 API LOGOUT REQUEST');
      print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      print('Method: POST');
      print('Endpoint: $endpoint');
      print('Authorization: Bearer ${token.substring(0, 20)}...${token.substring(token.length - 10)}');
      print('Request Body: ${jsonEncode(body)}');
      print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        await TokenStorage.clearToken();
        await TokenStorage.clearUser();
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        await TokenStorage.clearToken();
        await TokenStorage.clearUser();
        throw Exception(result['message'] ?? 'Logout failed');
      }
    } catch (e) {
      _logError(e.toString());
      await TokenStorage.clearToken();
      await TokenStorage.clearUser();
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await TokenStorage.getToken();
    return token != null && token.isNotEmpty;
  }

  Future<String?> getToken() async {
    return TokenStorage.getToken();
  }

  Future<Map<String, dynamic>?> getUser() async {
    return TokenStorage.getUser();
  }

  Future<Map<String, dynamic>> updateProfile({
    required String name,
    required String number,
    required String? password,
    required Map<String, dynamic> address,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}${dotenv.env['PROFILE_ENDPOINT']}';

      final body = {
        'name': name,
        'number': number,
        'address': address,
      };

      if (password != null && password.isNotEmpty) {
        body['password'] = password;
      }
      
      _logRequest('PUT', endpoint, body: body);

      final response = await http.put(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        await TokenStorage.saveUser(result['data']);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to update profile');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> uploadProfilePicture(File imageFile) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/profile/picture';
      
      _logRequest('POST', endpoint, body: {'profile_pic': 'file: ${imageFile.path}'});

      final request = http.MultipartRequest('POST', Uri.parse(endpoint));
      request.headers['Authorization'] = 'Bearer $token';
      
      final filePath = imageFile.path.toLowerCase();
      String mimeType = 'jpeg';
      if (filePath.endsWith('.png')) {
        mimeType = 'png';
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        mimeType = 'jpeg';
      } else if (filePath.endsWith('.gif')) {
        mimeType = 'gif';
      } else if (filePath.endsWith('.webp')) {
        mimeType = 'webp';
      }
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'profile_pic',
          imageFile.path,
          contentType: http.MediaType('image', mimeType),
        ),
      );

      final streamResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamResponse);

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        await TokenStorage.saveUser(result['data']);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to upload profile picture');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Uint8List?> getProfilePicture() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/profile/picture';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Accept': 'image/jpeg, image/png',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        _logResponse('SUCCESS (200)', 'Profile picture fetched (${response.bodyBytes.length} bytes)');
        return response.bodyBytes;
      } else {
        _logResponse('FAILED (${response.statusCode})', response.body);
        return null;
      }
    } catch (e) {
      _logError(e.toString());
      return null;
    }
  }

  Future<Map<String, dynamic>> getEngineerTasks({
    required String engineerId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/engineer/$engineerId/tasks';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch tasks');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getTaskById(int taskId) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch task');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> acceptTask(int taskId, String engineerId) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/accept';
      
      _logRequest('POST', endpoint, body: {'engineer_id': engineerId});

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'engineer_id': engineerId}),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to accept task');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> rejectTask(int taskId, String engineerId, String reason) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/reject';
      
      _logRequest('POST', endpoint, body: {'engineer_id': engineerId, 'reason': reason});

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'engineer_id': engineerId, 'reason': reason}),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to reject task');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> waitTask(int taskId, String engineerId, String reason) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/wait';
      
      _logRequest('POST', endpoint, body: {'engineer_id': engineerId, 'reason': reason});

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'engineer_id': engineerId, 'reason': reason}),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to mark task as waiting');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getParts() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/parts';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch parts');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> completeTask({
    required int taskId,
    required String engineerId,
    required String deviceId,
    required List<File> photos,
    List<String>? parts,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/complete';
      
      _logRequest('POST', endpoint, body: {
        'task_id': taskId,
        'engineer_id': engineerId,
        'device_id': deviceId,
        'photos': 'File(s) - ${photos.length} files',
        'parts': parts ?? [],
      });

      final request = http.MultipartRequest('POST', Uri.parse(endpoint));
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['engineer_id'] = engineerId;
      request.fields['device_id'] = deviceId;
      
      if (parts != null && parts.isNotEmpty) {
        request.fields['parts'] = jsonEncode(parts);
      }

      for (int i = 0; i < photos.length; i++) {
        final filePath = photos[i].path.toLowerCase();
        String mimeType = 'jpeg';
        if (filePath.endsWith('.png')) {
          mimeType = 'png';
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          mimeType = 'jpeg';
        } else if (filePath.endsWith('.gif')) {
          mimeType = 'gif';
        }

        request.files.add(
          await http.MultipartFile.fromPath(
            'photos',
            photos[i].path,
            contentType: http.MediaType('image', mimeType),
          ),
        );
      }

      final streamResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamResponse);

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to complete task');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getEngineerHistory({
    required String engineerId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/engineer/$engineerId/history';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch history');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getTaskHistory(int taskId) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/history';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch task history');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<DashboardAnalytics> getDashboardAnalytics() async {
    try {
      final token = await TokenStorage.getToken();
      final user = await TokenStorage.getUser();
      
      if (token == null || user == null) {
        throw Exception('No authentication token or user found');
      }

      final userId = user['user_id'];
      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/engineer/$userId/dashboard';
      
      _logRequest('GET', endpoint);

      final response = await http.get(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return DashboardAnalytics.fromJson(result['data']);
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to fetch dashboard analytics');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> configureDevice({
    required String deviceId,
    required String engineerId,
    required String macId,
    required int taskId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/devices/$deviceId/configure';
      
      final body = {
        'engineer_id': engineerId,
        'mac_id': macId,
        'task_id': taskId,
      };

      _logRequest('POST', endpoint, body: body);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to configure device');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> sendDeviceHandshake({
    required String deviceId,
    required int taskId,
    required String engineerId,
    required Map<String, dynamic> handshakeData,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/devices/$deviceId/handshake';
      
      final body = {
        ...handshakeData,
        'engineer_id': engineerId,
        'task_id': taskId,
      };

      _logRequest('POST', endpoint, body: body);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Device handshake failed');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> sendDeviceReset({
    required String deviceId,
    required int taskId,
    required String engineerId,
    required Map<String, dynamic> resetData,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/devices/$deviceId/reset';
      
      final body = {
        ...resetData,
        'engineer_id': engineerId,
        'task_id': taskId,
      };

      _logRequest('POST', endpoint, body: body);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Device reset failed');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> configureTask({
    required int taskId,
    required String engineerId,
    required String macId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final endpoint = '${dotenv.env['BASE_URL']}${dotenv.env['API_VERSION']}/tasks/$taskId/configure';
      
      final body = {
        'engineer_id': engineerId,
        'mac_id': macId,
      };

      _logRequest('POST', endpoint, body: body);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      final result = jsonDecode(response.body);

      if (response.statusCode == 200 && result['success'] == true) {
        _logResponse('SUCCESS (200)', result);
        return result;
      } else {
        _logResponse('FAILED (${response.statusCode})', result);
        throw Exception(result['message'] ?? 'Failed to configure task');
      }
    } catch (e) {
      _logError(e.toString());
      throw Exception('Network error: ${e.toString()}');
    }
  }
}
