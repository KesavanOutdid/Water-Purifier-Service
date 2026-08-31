import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../themes/app_theme.dart';

class AlertUtils {
  static String getUserFriendlyErrorMessage(dynamic error) {
    String errorStr = error.toString();
    
    errorStr = errorStr
        .replaceAll(RegExp(r'Exception:\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'PlatformException\([^)]*,\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r',\s*null\s*\)', caseSensitive: false), '')
        .trim();
    
    String lowerStr = errorStr.toLowerCase();
    
    if (lowerStr.contains('connection_error') || 
        lowerStr.contains('socket') || 
        lowerStr.contains('read failed') ||
        lowerStr.contains('timeout') ||
        lowerStr.contains('closed')) {
      return 'Unable to connect to the device. Please try again.';
    }
    
    if (lowerStr.contains('bluetooth permission') || 
        (lowerStr.contains('permission') && lowerStr.contains('denied'))) {
      return 'Permission denied. Please grant the required permissions.';
    }
    
    if (lowerStr.contains('bluetooth') && lowerStr.contains('off')) {
      return 'Bluetooth is turned off. Please enable Bluetooth.';
    }
    
    if (lowerStr.contains('out of range') || lowerStr.contains('rssi')) {
      return 'Device is out of range. Please move closer and try again.';
    }
    
    if (lowerStr.contains('no data') || lowerStr.contains('empty')) {
      return 'No response from device. Please try again.';
    }
    
    if (lowerStr.contains('failed to receive') || lowerStr.contains('no response')) {
      return 'Device did not respond. Please try again.';
    }
    
    if (lowerStr.contains('device not found')) {
      return 'Device not found. Please try again.';
    }
    
    if (lowerStr.startsWith('network error:')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (lowerStr.contains('already connected')) {
      return 'Device is already connected.';
    }
    
    if (errorStr.isNotEmpty) {
      return errorStr;
    }
    
    return 'An error occurred. Please try again later.';
  }
  static void showSuccessAlert(
    BuildContext context, {
    required String title,
    required String message,
    VoidCallback? onClose,
  }) {
    _showAlert(
      context,
      title: title,
      message: message,
      icon: Icons.check_circle_rounded,
      iconColor: Colors.green,
      backgroundColor: Colors.green.shade50,
      borderColor: Colors.green.shade200,
      onClose: onClose,
    );
  }

  static void showErrorAlert(
    BuildContext context, {
    required String title,
    required String message,
    VoidCallback? onClose,
  }) {
    _showAlert(
      context,
      title: title,
      message: message,
      icon: Icons.error_rounded,
      iconColor: Colors.red,
      backgroundColor: Colors.red.shade50,
      borderColor: Colors.red.shade200,
      onClose: onClose,
    );
  }

  static void showWarningAlert(
    BuildContext context, {
    required String title,
    required String message,
    VoidCallback? onClose,
  }) {
    _showAlert(
      context,
      title: title,
      message: message,
      icon: Icons.warning_rounded,
      iconColor: Colors.orange,
      backgroundColor: Colors.orange.shade50,
      borderColor: Colors.orange.shade200,
      onClose: onClose,
    );
  }

  static void showInfoAlert(
    BuildContext context, {
    required String title,
    required String message,
    VoidCallback? onClose,
  }) {
    _showAlert(
      context,
      title: title,
      message: message,
      icon: Icons.info_rounded,
      iconColor: Colors.blue,
      backgroundColor: Colors.blue.shade50,
      borderColor: Colors.blue.shade200,
      onClose: onClose,
    );
  }

  static void _showAlert(
    BuildContext context, {
    required String title,
    required String message,
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
    required Color borderColor,
    VoidCallback? onClose,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return _SweetAlertDialog(
          title: title,
          message: message,
          icon: icon,
          iconColor: iconColor,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          onClose: onClose,
        );
      },
    );
  }
}

class _SweetAlertDialog extends StatefulWidget {
  final String title;
  final String message;
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final Color borderColor;
  final VoidCallback? onClose;

  const _SweetAlertDialog({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.borderColor,
    this.onClose,
  });

  @override
  State<_SweetAlertDialog> createState() => _SweetAlertDialogState();
}

class _SweetAlertDialogState extends State<_SweetAlertDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _animationController.forward();

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pop();
        widget.onClose?.call();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: widget.borderColor,
            width: 2,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: widget.backgroundColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                widget.icon,
                color: widget.iconColor,
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              widget.title,
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              widget.message,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: AppTheme.textSecondaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () {
                Navigator.of(context).pop();
                widget.onClose?.call();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: widget.iconColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Close',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
