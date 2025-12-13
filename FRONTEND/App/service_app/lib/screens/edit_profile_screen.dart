import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:get/get.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';
import '../services/api_service.dart';
import '../services/pincode_service.dart';

class EditProfileScreen extends StatefulWidget {
  final String userName;
  final String userPhone;
  final Map<String, dynamic>? addressData;

  const EditProfileScreen({
    Key? key,
    required this.userName,
    required this.userPhone,
    required this.addressData,
  }) : super(key: key);

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController nameController;
  late TextEditingController phoneController;
  late TextEditingController emailController;
  late TextEditingController passwordController;
  late TextEditingController confirmPasswordController;
  late TextEditingController doorNoController;
  late TextEditingController streetController;
  late TextEditingController cityController;
  late TextEditingController districtController;
  late TextEditingController stateController;
  late TextEditingController countryController;
  late TextEditingController pincodeController;

  late ApiService _apiService;
  bool hasChanges = false;
  bool isLoading = false;
  bool isPincodeLookupLoading = false;
  String passwordError = '';
  String phoneError = '';
  String emailError = '';
  String pincodeError = '';

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();

    nameController = TextEditingController(text: widget.userName);
    phoneController = TextEditingController(
      text: widget.userPhone.isEmpty ? '+91' : widget.userPhone,
    );
    emailController = TextEditingController();
    passwordController = TextEditingController();
    confirmPasswordController = TextEditingController();
    doorNoController = TextEditingController(
      text: widget.addressData?['doorno'] ?? '',
    );
    streetController = TextEditingController(
      text: widget.addressData?['street'] ?? '',
    );
    cityController = TextEditingController(
      text: widget.addressData?['city'] ?? '',
    );
    districtController = TextEditingController(
      text: widget.addressData?['district'] ?? '',
    );
    stateController = TextEditingController(
      text: widget.addressData?['state'] ?? '',
    );
    countryController = TextEditingController(
      text: widget.addressData?['country'] ?? 'India',
    );
    pincodeController = TextEditingController(
      text: widget.addressData?['pincode'] ?? '',
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    doorNoController.dispose();
    streetController.dispose();
    cityController.dispose();
    districtController.dispose();
    stateController.dispose();
    countryController.dispose();
    pincodeController.dispose();
    super.dispose();
  }

  Future<void> _lookupPincode(String pincode) async {
    if (pincode.length != 6) {
      return;
    }

    setState(() => isPincodeLookupLoading = true);

    try {
      final location = await PincodeService.getLocationByPincode(pincode);

      if (location != null) {
        setState(() {
          cityController.text = location['city'] ?? '';
          stateController.text = location['state'] ?? '';
          districtController.text = location['district'] ?? '';
        });

        Get.snackbar(
          'Success',
          'Location found for pincode $pincode',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppTheme.successColor,
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
          icon: const Icon(Icons.check_circle, color: Colors.white),
        );
      } else {
        Get.snackbar(
          'Info',
          'Pincode not found. Please enter details manually.',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppTheme.primaryColor,
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
          icon: const Icon(Icons.info, color: Colors.white),
        );
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to lookup pincode',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.errorColor,
        colorText: Colors.white,
        duration: const Duration(seconds: 2),
        icon: const Icon(Icons.error, color: Colors.white),
      );
    } finally {
      setState(() => isPincodeLookupLoading = false);
    }
  }

  void _updateHasChanges() {
    setState(() {
      hasChanges = nameController.text != widget.userName ||
          phoneController.text != widget.userPhone ||
          passwordController.text.isNotEmpty ||
          doorNoController.text != (widget.addressData?['doorno'] ?? '') ||
          streetController.text != (widget.addressData?['street'] ?? '') ||
          cityController.text != (widget.addressData?['city'] ?? '') ||
          districtController.text != (widget.addressData?['district'] ?? '') ||
          stateController.text != (widget.addressData?['state'] ?? '') ||
          countryController.text != (widget.addressData?['country'] ?? 'India') ||
          pincodeController.text != (widget.addressData?['pincode'] ?? '');
    });
  }

  void _updatePasswordError() {
    setState(() {
      if (passwordController.text.isNotEmpty && confirmPasswordController.text.isNotEmpty) {
        if (passwordController.text != confirmPasswordController.text) {
          passwordError = 'PINs do not match';
        } else {
          passwordError = '';
        }
      } else {
        passwordError = '';
      }
    });
  }

  void _validatePhone(String value) {
    setState(() {
      if (value.isEmpty) {
        phoneError = '';
        return;
      }

      String cleaned = value.replaceAll(RegExp(r'[^\d+]'), '');

      if (cleaned.startsWith('+91')) {
        if (cleaned.length != 13) {
          phoneError = 'Phone must be +91 followed by 10 digits';
        } else {
          phoneError = '';
        }
      } else if (cleaned.startsWith('0')) {
        if (cleaned.length != 11) {
          phoneError = 'Phone must be 0 followed by 10 digits';
        } else {
          phoneError = '';
        }
      } else if (RegExp(r'^\d{10}$').hasMatch(cleaned)) {
        phoneError = '';
      } else {
        phoneError = 'Invalid phone format (10 digits or +91XXXXXXXXXX)';
      }
    });
  }

  void _validateEmail(String value) {
    setState(() {
      if (value.isEmpty) {
        emailError = '';
        return;
      }

      final emailRegex = RegExp(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
      );

      if (!emailRegex.hasMatch(value)) {
        emailError = 'Please enter a valid email address';
      } else {
        emailError = '';
      }
    });
  }

  void _validatePincode(String value) {
    setState(() {
      if (value.isEmpty) {
        pincodeError = '';
        return;
      }

      if (!RegExp(r'^\d{6}$').hasMatch(value)) {
        pincodeError = 'Pincode must be exactly 6 digits';
      } else {
        pincodeError = '';
      }
    });
  }

  Future<void> _saveProfile() async {
    setState(() => isLoading = true);

    try {
      await _apiService.updateProfile(
        name: nameController.text,
        number: phoneController.text,
        password: passwordController.text.isEmpty ? null : passwordController.text,
        address: {
          'doorno': doorNoController.text,
          'street': streetController.text,
          'city': cityController.text,
          'district': districtController.text,
          'state': stateController.text,
          'country': countryController.text,
          'pincode': pincodeController.text,
        },
      );

      if (mounted) {
        AlertUtils.showSuccessAlert(
          context,
          title: 'Success',
          message: 'Profile updated successfully',
          onClose: () {
            Navigator.pop(context, true);
          },
        );
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: e.toString().replaceFirst('Exception: ', ''),
        );
      }

      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Personal Information',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                onChanged: (value) => _updateHasChanges(),
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your name',
                  prefixIcon: const Icon(Icons.person),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                onChanged: (value) {
                  _updateHasChanges();
                  _validatePhone(value);
                },
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone',
                  hintText: '+91 XXXXXXXXXX',
                  prefixIcon: const Icon(Icons.phone),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  errorBorder: phoneError.isNotEmpty
                      ? OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppTheme.errorColor,
                            width: 1.5,
                          ),
                        )
                      : null,
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: phoneError.isNotEmpty
                          ? AppTheme.errorColor
                          : AppTheme.primaryColor,
                      width: phoneError.isNotEmpty ? 1.5 : 1,
                    ),
                  ),
                ),
              ),
              if (phoneError.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.errorColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppTheme.errorColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: AppTheme.errorColor, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          phoneError,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppTheme.errorColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              // const SizedBox(height: 16),
              // TextField(
              //   controller: emailController,
              //   onChanged: (value) {
              //     _updateHasChanges();
              //     _validateEmail(value);
              //   },
              //   keyboardType: TextInputType.emailAddress,
              //   decoration: InputDecoration(
              //     labelText: 'Email (Optional)',
              //     hintText: 'your.email@example.com',
              //     prefixIcon: const Icon(Icons.email),
              //     border: OutlineInputBorder(
              //       borderRadius: BorderRadius.circular(12),
              //     ),
              //     errorBorder: emailError.isNotEmpty
              //         ? OutlineInputBorder(
              //             borderRadius: BorderRadius.circular(12),
              //             borderSide: const BorderSide(
              //               color: AppTheme.errorColor,
              //               width: 1.5,
              //             ),
              //           )
              //         : null,
              //     focusedBorder: OutlineInputBorder(
              //       borderRadius: BorderRadius.circular(12),
              //       borderSide: BorderSide(
              //         color: emailError.isNotEmpty
              //             ? AppTheme.errorColor
              //             : AppTheme.primaryColor,
              //         width: emailError.isNotEmpty ? 1.5 : 1,
              //       ),
              //     ),
              //   ),
              // ),
              // if (emailError.isNotEmpty) ...[
              //   const SizedBox(height: 8),
              //   Container(
              //     padding: const EdgeInsets.all(12),
              //     decoration: BoxDecoration(
              //       color: AppTheme.errorColor.withValues(alpha: 0.1),
              //       borderRadius: BorderRadius.circular(8),
              //       border: Border.all(
              //         color: AppTheme.errorColor.withValues(alpha: 0.3),
              //       ),
              //     ),
              //     child: Row(
              //       children: [
              //         const Icon(Icons.error, color: AppTheme.errorColor, size: 18),
              //         const SizedBox(width: 8),
              //         Expanded(
              //           child: Text(
              //             emailError,
              //             style: GoogleFonts.poppins(
              //               fontSize: 12,
              //               color: AppTheme.errorColor,
              //               fontWeight: FontWeight.w500,
              //             ),
              //           ),
              //         ),
              //       ],
              //     ),
              //   ),
              // ],
              const SizedBox(height: 24),
              Text(
                'Security',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'New Password (4-Digit PIN - Optional)',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: _PasswordPinInputBox(
                        value: index < passwordController.text.length
                            ? passwordController.text[index]
                            : '',
                        onChanged: (value) {
                          setState(() {
                            if (value.isNotEmpty && passwordController.text.length < 4) {
                              passwordController.text += value;
                            } else if (value.isEmpty && passwordController.text.isNotEmpty) {
                              passwordController.text = passwordController.text
                                  .substring(0, passwordController.text.length - 1);
                            }
                            _updateHasChanges();
                            _updatePasswordError();
                          });
                        },
                      ),
                    );
                  }),
                ),
              ),
              if (passwordController.text.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Confirm Password (4-Digit PIN)',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(4, (index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: _PasswordPinInputBox(
                          value: index < confirmPasswordController.text.length
                              ? confirmPasswordController.text[index]
                              : '',
                          onChanged: (value) {
                            setState(() {
                              if (value.isNotEmpty && confirmPasswordController.text.length < 4) {
                                confirmPasswordController.text += value;
                              } else if (value.isEmpty && confirmPasswordController.text.isNotEmpty) {
                                confirmPasswordController.text = confirmPasswordController.text
                                    .substring(0, confirmPasswordController.text.length - 1);
                              }
                              _updatePasswordError();
                            });
                          },
                        ),
                      );
                    }),
                  ),
                ),
                if (passwordError.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppTheme.errorColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error, color: AppTheme.errorColor, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            passwordError,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppTheme.errorColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
              const SizedBox(height: 24),
              Text(
                'Address Details',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: TextField(
                      controller: doorNoController,
                      onChanged: (value) => _updateHasChanges(),
                      decoration: InputDecoration(
                        labelText: 'Door No.',
                        hintText: 'No.',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: streetController,
                      onChanged: (value) => _updateHasChanges(),
                      decoration: InputDecoration(
                        labelText: 'Street',
                        hintText: 'Street/Road',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Pincode (small) + District (expanded, no icon)
              Row(
                children: [
                  SizedBox(
                    width: 120, // small width similar to Door No visual weight
                    child: TextField(
                      controller: pincodeController,
                      onChanged: (value) {
                        _updateHasChanges();
                        _validatePincode(value);
                        if (value.length == 6 && pincodeError.isEmpty) {
                          _lookupPincode(value);
                        }
                      },
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Pincode',
                        hintText: '6-digit',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        errorBorder: pincodeError.isNotEmpty
                            ? OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppTheme.errorColor,
                                  width: 1.5,
                                ),
                              )
                            : null,
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: pincodeError.isNotEmpty
                                ? AppTheme.errorColor
                                : AppTheme.primaryColor,
                            width: pincodeError.isNotEmpty ? 1.5 : 1,
                          ),
                        ),
                        suffixIcon: isPincodeLookupLoading
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppTheme.primaryColor,
                                    ),
                                  ),
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: districtController,
                      onChanged: (value) => _updateHasChanges(),
                      decoration: InputDecoration(
                        labelText: 'District',
                        hintText: 'District',
                        // removed prefixIcon as requested
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              if (pincodeError.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.errorColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppTheme.errorColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: AppTheme.errorColor, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          pincodeError,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppTheme.errorColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: cityController,
                      onChanged: (value) => _updateHasChanges(),
                      decoration: InputDecoration(
                        labelText: 'City',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: stateController,
                      onChanged: (value) => _updateHasChanges(),
                      decoration: InputDecoration(
                        labelText: 'State',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
               const SizedBox(width: 12, height: 16),
              // Country small width (like pincode)
              SizedBox(
                width: 120,
                child: TextField(
                  controller: countryController,
                  onChanged: (value) => _updateHasChanges(),
                  decoration: InputDecoration(
                    labelText: 'Country',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: isLoading ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Cancel',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: !hasChanges ||
                              isLoading ||
                              passwordError.isNotEmpty ||
                              phoneError.isNotEmpty ||
                              emailError.isNotEmpty ||
                              pincodeError.isNotEmpty
                          ? null
                          : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              'Save',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
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
