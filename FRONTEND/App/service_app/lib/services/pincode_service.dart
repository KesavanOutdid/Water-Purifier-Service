import 'package:http/http.dart' as http;
import 'dart:convert';

class PincodeService {
  static const String _pincodeApiUrl = 'https://api.postalpincode.in/postoffice';

  static Future<Map<String, String>?> getLocationByPincode(String pincode) async {
    if (pincode.isEmpty || pincode.length != 6) {
      return null;
    }

    try {
      final response = await http.get(
        Uri.parse('$_pincodeApiUrl/$pincode'),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);

        if (result is List && result.isNotEmpty) {
          final data = result[0];

          if (data['Status'] == 'Success' && data['PostOffice'] is List) {
            final postOffice = data['PostOffice'][0];

            return {
              'city': postOffice['District'] ?? '',
              'state': postOffice['State'] ?? '',
              'district': postOffice['District'] ?? '',
            };
          }
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}
