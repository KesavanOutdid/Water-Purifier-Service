import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:google_fonts/google_fonts.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';
import 'privacy_policy_screen.dart';
import 'help_support_screen.dart';
import 'edit_profile_screen.dart';
import 'service_history_screen.dart';
import '../services/api_service.dart';
import '../services/token_storage.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool notificationsEnabled = true;
  late ApiService _apiService;
  late ImagePicker _imagePicker;
  
  String _userName = 'John Doe';
  String _userEmail = 'john.doe@email.com';
  String _userPhone = '+1 234 567 8900';
  Map<String, dynamic>? _addressData;
  bool _isLoadingProfile = false;
  bool _isUploadingImage = false;
  Uint8List? _profilePicBytes;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _imagePicker = ImagePicker();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animationController.forward();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() => _isLoadingProfile = true);
    try {
      final response = await _apiService.getProfile();
      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        
        final profilePicBytes = await _apiService.getProfilePicture();
        
        setState(() {
          _userName = data['name'] ?? 'User';
          _userEmail = data['email'] ?? '';
          _userPhone = data['number'] ?? '';
          _addressData = data['address'] ?? {};
          _profilePicBytes = profilePicBytes;
        });
      } else {
        if (mounted) {
          AlertUtils.showErrorAlert(
            context,
            title: 'Error',
            message: 'Failed to load profile',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Error loading profile: $e',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingProfile = false);
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0)
            .animate(_animationController),
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildProfileSection(),
              const SizedBox(height: 20),
              _buildSettingsSection(),
              const SizedBox(height: 20),
              _buildAboutSection(),
              const SizedBox(height: 20),
              _buildLogoutSection(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: 2,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondaryColor,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build),
            label: 'Service',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.of(context).pushReplacementNamed('/home');
              break;
            case 1:
              Navigator.of(context).pushNamed('/service');
              break;
            case 2:
              break;
          }
        },
      ),
    );
  }

  Widget _buildProfileSection() {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ).animate(_animationController),
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryDarkColor,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                  child: CircleAvatar(
                    backgroundColor: Colors.white24,
                    backgroundImage: _profilePicBytes != null
                        ? MemoryImage(_profilePicBytes!)
                        : null,
                    child: _profilePicBytes == null
                        ? const Icon(
                            Icons.person,
                            size: 50,
                            color: Colors.white,
                          )
                        : null,
                  ),
                ),
                GestureDetector(
                  onTap: _isUploadingImage ? null : () => _showImagePickerDialog(),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: _isUploadingImage
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                AppTheme.primaryColor,
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.edit,
                            color: AppTheme.primaryColor,
                            size: 18,
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_isLoadingProfile)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 2,
                ),
              )
            else
              Column(
                children: [
                  Text(
                    _userName,
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _userEmail,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => EditProfileScreen(
                      userName: _userName,
                      userPhone: _userPhone,
                      addressData: _addressData,
                    ),
                  ),
                ).then((result) {
                  if (result == true) {
                    _loadProfileData();
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                ),
                child: Text(
                  'Edit Profile',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
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

  Widget _buildSettingsSection() {
    return Column(
      children: [
        _buildSectionHeader('Preferences'),
        _buildSettingsTile(
          icon: Icons.notifications,
          title: 'Notifications',
          subtitle: 'Service reminders and updates',
          trailing: Switch(
            value: notificationsEnabled,
            onChanged: (value) {
              setState(() {
                notificationsEnabled = value;
              });
            },
            activeThumbColor: AppTheme.primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildAboutSection() {
    return Column(
      children: [
        _buildSectionHeader('Support'),
        _buildSettingsTile(
          icon: Icons.help,
          title: 'Help & Support',
          subtitle: 'FAQs, contact & technical support',
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const HelpSupportScreen(),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        _buildSectionHeader('History'),
        _buildSettingsTile(
          icon: Icons.history,
          title: 'Service History',
          subtitle: 'View your service requests',
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => ServiceHistoryScreen(),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        _buildSectionHeader('About'),
        _buildSettingsTile(
          icon: Icons.privacy_tip,
          title: 'Privacy Policy',
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const PrivacyPolicyScreen(),
              ),
            );
          },
        ),
        _buildSettingsTile(
          icon: Icons.info_outline,
          title: 'About',
          subtitle: 'Version 1.0.0',
          onTap: () {
            _showAboutDialog();
          },
        ),
      ],
    );
  }

  Widget _buildLogoutSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.3),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: _animationController,
          curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
        )),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  _showLogoutDialog();
                },
                icon: const Icon(Icons.logout, size: 16),
                label: const Text('Logout'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.errorColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimaryColor,
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.primaryColor.withValues(alpha: 0.1),
          ),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimaryColor,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: AppTheme.textSecondaryColor,
                ),
              )
            : null,
        trailing: trailing ?? const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 90,
      );

      if (image != null) {
        if (mounted) Navigator.pop(context);
        await _uploadProfilePicture(File(image.path));
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Failed to pick image from camera',
        );
      }
    }
  }

  Future<void> _pickImageFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 90,
      );

      if (image != null) {
        if (mounted) Navigator.pop(context);
        await _uploadProfilePicture(File(image.path));
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Failed to pick image from gallery',
        );
      }
    }
  }

  Future<void> _uploadProfilePicture(File imageFile) async {
    setState(() => _isUploadingImage = true);

    try {
      await _apiService.uploadProfilePicture(imageFile);

      if (mounted) {
        AlertUtils.showSuccessAlert(
          context,
          title: 'Success',
          message: 'Profile picture uploaded successfully',
        );
      }

      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        final profilePicBytes = await _apiService.getProfilePicture();
        if (mounted) {
          setState(() {
            _profilePicBytes = profilePicBytes;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
      }
    }
  }

  void _showImagePickerDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Change Profile Picture',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildImagePickerButton(
                  icon: Icons.camera_alt,
                  label: 'Camera',
                  onTap: _pickImageFromCamera,
                ),
                _buildImagePickerButton(
                  icon: Icons.image,
                  label: 'Gallery',
                  onTap: _pickImageFromGallery,
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePickerButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
            ),
            child: Icon(
              icon,
              color: AppTheme.primaryColor,
              size: 32,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    final navigator = Navigator.of(context);
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Logout',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
        ),
        content: Text(
          'Are you sure you want to logout?',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(color: AppTheme.textSecondaryColor),
            ),
          ),
          TextButton(
            onPressed: () async {
              try {
                Navigator.pop(dialogContext);
                
                await _apiService.logout();
                await TokenStorage.clearAll();
                
                if (mounted) {
                  AlertUtils.showSuccessAlert(
                    context,
                    title: 'Logged Out',
                    message: 'You have been logged out successfully',
                    onClose: () {
                      navigator.pushReplacementNamed('/onboarding');
                    },
                  );
                }
              } catch (e) {
                if (mounted) {
                  AlertUtils.showErrorAlert(
                    context,
                    title: 'Error',
                    message: 'Failed to logout: $e',
                  );
                }
              }
            },
            child: Text(
              'Logout',
              style: GoogleFonts.poppins(color: AppTheme.errorColor),
            ),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'About',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Water Purifier Service App',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Version 1.0.0',
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: AppTheme.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Designed for service engineers who ensure clean and safe drinking water for every home. This app helps you manage tasks, track services, and deliver reliable maintenance on time.',
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: AppTheme.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '© 2025  Services. All rights reserved.',
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: AppTheme.textSecondaryColor,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: GoogleFonts.poppins(color: AppTheme.primaryColor),
            ),
          ),
        ],
      ),
    );
  }
}

class _PasswordPinInputBox extends StatefulWidget {
  final String value;
  final Function(String) onChanged;

  const _PasswordPinInputBox({
    required this.value,
    required this.onChanged,
  });

  @override
  State<_PasswordPinInputBox> createState() => _PasswordPinInputBoxState();
}

class _PasswordPinInputBoxState extends State<_PasswordPinInputBox> {
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
