import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';
import '../widgets/custom_button.dart';
import '../services/api_service.dart';
import '../services/firebase_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late TextEditingController _emailController;
  late TextEditingController _pinController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  String _errorMessage = '';
  late ApiService _apiService;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _pinController = TextEditingController();
    _apiService = ApiService();

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _pinController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _errorMessage = '';
    });

    if (_emailController.text.isEmpty || _pinController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please fill in all fields';
      });
      return;
    }

    if (_pinController.text.length != 4) {
      setState(() {
        _errorMessage = 'PIN must be 4 digits';
      });
      return;
    }

    setState(() => _isLoading = true);

    try {
      final fcmToken = await FirebaseService().getFCMToken();
      final deviceInfo = await _getDeviceInfo();

      final response = await _apiService.login(
        email: _emailController.text.trim(),
        password: _pinController.text,
        fcmToken: fcmToken,
        deviceInfo: deviceInfo,
      );

      if (mounted) {
        setState(() => _isLoading = false);

        if (response['success'] == true) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => LoginSuccessDialog(
              email: _emailController.text,
              userName: response['data']['user']['name'] ?? 'User',
              onContinue: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushReplacementNamed('/home');
              },
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
        AlertUtils.showErrorAlert(
          context,
          title: 'Login Failed',
          message: _errorMessage,
        );
      }
    }
  }

  Future<Map<String, dynamic>> _getDeviceInfo() async {
    try {
      final deviceInfoPlugin = DeviceInfoPlugin();
      final androidInfo = await deviceInfoPlugin.androidInfo;
      
      return {
        'deviceName': androidInfo.model,
        'osVersion': '${androidInfo.version.release}',
        'appVersion': '1.0.0',
      };
    } catch (e) {
      print('Error getting device info: $e');
      return {
        'deviceName': 'Unknown',
        'osVersion': 'Unknown',
        'appVersion': '1.0.0',
      };
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              height: 250,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.2),
                      ),
                      child: const Icon(
                        Icons.water_drop,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Welcome Back',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Login to your account',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Email Address',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          hintText: 'Enter your email',
                          prefixIcon: const Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        '4-Digit PIN',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _buildPinField(),
                      const SizedBox(height: 16),
                      if (_errorMessage.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.errorColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppTheme.errorColor.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            _errorMessage,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppTheme.errorColor,
                            ),
                          ),
                        ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'Login',
                        onPressed: _login,
                        isLoading: _isLoading,
                      ),
                      const SizedBox(height: 24),
                      // Row(
                      //   mainAxisAlignment: MainAxisAlignment.center,
                      //   children: [
                      //     Text(
                      //       "Don't have an account? ",
                      //       style: GoogleFonts.poppins(
                      //         fontSize: 14,
                      //         color: AppTheme.textSecondaryColor,
                      //       ),
                      //     ),
                      //     GestureDetector(
                      //       onTap: () {},
                      //       child: Text(
                      //         'Sign Up',
                      //         style: GoogleFonts.poppins(
                      //           fontSize: 14,
                      //           color: AppTheme.primaryColor,
                      //           fontWeight: FontWeight.w600,
                      //         ),
                      //       ),
                      //     ),
                      //   ],
                      // ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPinField() {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(4, (index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: _PinInputBox(
              value: index < _pinController.text.length
                  ? _pinController.text[index]
                  : '',
              onChanged: (value) {
                setState(() {
                  if (value.isNotEmpty && _pinController.text.length < 4) {
                    _pinController.text += value;
                  } else if (value.isEmpty && _pinController.text.isNotEmpty) {
                    _pinController.text = _pinController.text
                        .substring(0, _pinController.text.length - 1);
                  }
                });
              },
            ),
          );
        }),
      ),
    );
  }
}

class _PinInputBox extends StatefulWidget {
  final String value;
  final Function(String) onChanged;

  const _PinInputBox({
    required this.value,
    required this.onChanged,
  });

  @override
  State<_PinInputBox> createState() => _PinInputBoxState();
}

class _PinInputBoxState extends State<_PinInputBox> {
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: TextField(
        focusNode: _focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        obscureText: true,
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppTheme.dividerColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppTheme.dividerColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppTheme.primaryColor,
              width: 2,
            ),
          ),
          contentPadding: const EdgeInsets.all(0),
        ),
        style: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppTheme.textPrimaryColor,
        ),
        onChanged: (value) {
          if (value.isNotEmpty) {
            widget.onChanged(value);
            FocusScope.of(context).nextFocus();
          }
        },
      ),
    );
  }
}

class LoginSuccessDialog extends StatefulWidget {
  final String email;
  final String userName;
  final VoidCallback onContinue;

  const LoginSuccessDialog({
    Key? key,
    required this.email,
    required this.userName,
    required this.onContinue,
  }) : super(key: key);

  @override
  State<LoginSuccessDialog> createState() => _LoginSuccessDialogState();
}

class _LoginSuccessDialogState extends State<LoginSuccessDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
        ),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: Tween<double>(begin: 0.0, end: 1.0).animate(
                  CurvedAnimation(
                    parent: _animationController,
                    curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
                  ),
                ),
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.successColor.withValues(alpha: 0.1),
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    size: 50,
                    color: AppTheme.successColor,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Welcome ${widget.userName}!',
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Login successful',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: AppTheme.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 24),
              CustomButton(
                text: 'Continue',
                onPressed: widget.onContinue,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
