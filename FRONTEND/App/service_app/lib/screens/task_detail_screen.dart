import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../models/service_model.dart';
import '../services/api_service.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';
import '../widgets/custom_button.dart';
import 'qr_scanner_screen.dart';
import 'bluetooth_config_screen.dart';

class TaskDetailScreen extends StatefulWidget {
  final TaskModel task;
  final String engineerId;
  final VoidCallback onTaskUpdated;

  const TaskDetailScreen({
    Key? key,
    required this.task,
    required this.engineerId,
    required this.onTaskUpdated,
  }) : super(key: key);

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final ApiService _apiService = ApiService();
  final ImagePicker _imagePicker = ImagePicker();
  
  late TaskModel currentTask;
  List<File> selectedPhotos = [];
  String deviceId = '';
  String rejectReason = '';
  bool isLoading = false;
  String? error;
  
  bool _isCustomerExpanded = true;
  bool _isDeviceExpanded = false;
  bool _isAssignmentExpanded = false;

  final List<String> rejectReasons = [
    'Not available at that location',
    'Device not working as expected',
    'Customer not available',
    'Need to reschedule',
    'Other'
  ];

  @override
  void initState() {
    super.initState();
    currentTask = widget.task;
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String taskStatus) {
    switch (taskStatus) {
      case 'created':
        return Colors.grey;
      case 'assigned':
        return Colors.blue;
      case 'accepted':
        return Colors.orange;
      case 'inProgress':
        return Colors.amber;
      case 'completed':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    if (selectedPhotos.length >= 3) {
      AlertUtils.showWarningAlert(
        context,
        title: 'Limit Reached',
        message: 'Maximum 3 photos allowed',
      );
      return;
    }

    try {
      final XFile? pickedFile = await _imagePicker.pickImage(source: source);
      if (pickedFile != null) {
        setState(() {
          selectedPhotos.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      AlertUtils.showErrorAlert(
        context,
        title: 'Error',
        message: 'Error picking image: $e',
      );
    }
  }

  Future<void> _acceptTask() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.acceptTask(
        currentTask.taskId,
        widget.engineerId,
      );

      if (response['success'] == true) {
        AlertUtils.showSuccessAlert(
          context,
          title: 'Success',
          message: 'Task accepted successfully',
          onClose: () {
            widget.onTaskUpdated();
            Navigator.of(context).pop();
          },
        );
      } else {
        setState(() {
          isLoading = false;
        });
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: response['message'] ?? 'Failed to accept task',
        );
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      AlertUtils.showErrorAlert(
        context,
        title: 'Error',
        message: e.toString(),
      );
    }
  }

  Future<void> _rejectTask() async {
    if (rejectReason.isEmpty) {
      AlertUtils.showWarningAlert(
        context,
        title: 'Required',
        message: 'Please select a rejection reason',
      );
      return;
    }

    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.rejectTask(
        currentTask.taskId,
        widget.engineerId,
        rejectReason,
      );

      if (response['success'] == true) {
        AlertUtils.showSuccessAlert(
          context,
          title: 'Success',
          message: 'Task rejected successfully',
          onClose: () {
            widget.onTaskUpdated();
            Navigator.of(context).pop();
          },
        );
      } else {
        setState(() {
          isLoading = false;
        });
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: response['message'] ?? 'Failed to reject task',
        );
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      AlertUtils.showErrorAlert(
        context,
        title: 'Error',
        message: e.toString(),
      );
    }
  }

  Future<void> _completeTask() async {
    if (selectedPhotos.isEmpty) {
      AlertUtils.showWarningAlert(
        context,
        title: 'Required',
        message: 'Please add at least one photo',
      );
      return;
    }

    if (deviceId.isEmpty) {
      AlertUtils.showWarningAlert(
        context,
        title: 'Required',
        message: 'Please enter or scan device ID',
      );
      return;
    }

    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.completeTask(
        taskId: currentTask.taskId,
        engineerId: widget.engineerId,
        deviceId: deviceId,
        photos: selectedPhotos,
      );

      if (response['success'] == true) {
        AlertUtils.showSuccessAlert(
          context,
          title: 'Success',
          message: 'Task completed successfully',
          onClose: () {
            widget.onTaskUpdated();
            Navigator.of(context).pop();
          },
        );
      } else {
        setState(() {
          isLoading = false;
        });
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: response['message'] ?? 'Failed to complete task',
        );
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      AlertUtils.showErrorAlert(
        context,
        title: 'Error',
        message: e.toString(),
      );
    }
  }

  void _showRejectDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.warning_rounded, color: Colors.red, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  'Reason for Rejection',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.red.shade900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: rejectReasons.length + 1,
                itemBuilder: (context, index) {
                  if (index == rejectReasons.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.dividerColor),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ListTile(
                          leading: const Icon(Icons.edit, color: Colors.blue),
                          title: Text(
                            'Other (Manual Entry)',
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                          ),
                          onTap: () {
                            Navigator.pop(context);
                            _showManualReasonDialog();
                          },
                        ),
                      ),
                    );
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.dividerColor),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.check_circle_outline),
                        title: Text(
                          rejectReasons[index],
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
                        ),
                        onTap: () {
                          setState(() {
                            rejectReason = rejectReasons[index];
                          });
                          Navigator.pop(context);
                          _rejectTask();
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _scanQRCode(Function(String) onScanned) async {
    try {
      final result = await Navigator.push<String>(
        context,
        MaterialPageRoute(builder: (context) => const QRScannerScreen()),
      );

      if (result != null && result.isNotEmpty) {
        onScanned(result);
        if (mounted) {
          setState(() {
            deviceId = result;
          });
          AlertUtils.showSuccessAlert(
            context,
            title: 'Success',
            message: 'Device ID scanned: $result',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Error scanning QR code: $e',
        );
      }
    }
  }

  void _showManualReasonDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.edit_note, color: Colors.red, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Rejection Reason',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.red.shade900,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Please provide a detailed reason for rejection',
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: AppTheme.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Enter your reason here...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppTheme.dividerColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Colors.red, width: 2),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
              style: GoogleFonts.poppins(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(color: Colors.grey.shade700),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.isNotEmpty) {
                setState(() {
                  rejectReason = controller.text;
                });
                Navigator.pop(context);
                _rejectTask();
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a reason')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Submit',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCompleteTaskDialog() {
    final deviceIdController = TextEditingController(text: deviceId);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Complete Task',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Add Photos (Maximum 3)',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        _pickImage(ImageSource.camera);
                        setModalState(() {});
                      },
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Camera'),
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        _pickImage(ImageSource.gallery);
                        setModalState(() {});
                      },
                      icon: const Icon(Icons.image),
                      label: const Text('Gallery'),
                    ),
                  ],
                ),
                if (selectedPhotos.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    '${selectedPhotos.length}/3 Photos Selected',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: selectedPhotos.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(
                                  selectedPhotos[index],
                                  width: 100,
                                  height: 100,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              Positioned(
                                top: 0,
                                right: 0,
                                child: GestureDetector(
                                  onTap: () {
                                    setModalState(() {
                                      selectedPhotos.removeAt(index);
                                    });
                                  },
                                  child: Container(
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.red,
                                    ),
                                    padding: const EdgeInsets.all(4),
                                    child: const Icon(
                                      Icons.close,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Text(
                  'Device ID',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  onChanged: (value) {
                    deviceId = value;
                  },
                  controller: deviceIdController,
                  decoration: InputDecoration(
                    hintText: 'Enter or scan device ID',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.qr_code),
                      onPressed: () async {
                        await _scanQRCode((scannedValue) {
                          deviceIdController.text = scannedValue;
                          deviceId = scannedValue;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: isLoading ? 'Completing...' : 'Complete Task',
                    onPressed: isLoading ? () {} : () { _completeTask(); },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        elevation: 0,
      ),
      body: FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0)
            .animate(_animationController),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTaskHeader(),
              const SizedBox(height: 24),
              _buildCollapsibleSection(
                title: 'Customer Information',
                icon: Icons.person_outline,
                borderColor: Colors.blue,
                isExpanded: _isCustomerExpanded,
                onExpandChanged: (value) {
                  setState(() {
                    _isCustomerExpanded = value;
                    if (value) {
                      _isDeviceExpanded = false;
                      _isAssignmentExpanded = false;
                    }
                  });
                },
                details: [
                  ('Name', currentTask.customerName),
                  ('Phone', currentTask.phone),
                  ('Email', currentTask.email),
                  ('Address', currentTask.address.fullAddress.isEmpty
                      ? 'No address'
                      : currentTask.address.fullAddress),
                ],
              ),
              _buildCollapsibleSection(
                title: 'Device Information',
                icon: Icons.devices,
                borderColor: Colors.orange,
                isExpanded: _isDeviceExpanded,
                onExpandChanged: (value) {
                  setState(() {
                    _isDeviceExpanded = value;
                    if (value) {
                      _isCustomerExpanded = false;
                      _isAssignmentExpanded = false;
                    }
                  });
                },
                details: [
                  ('Model', currentTask.modelName),
                  ('Model ID', currentTask.modelId),
                  ('Service Type', _getServiceTypeName(currentTask.serviceType)),
                  ('Local Distributor', currentTask.localDistributorName),
                  ('Distributor', currentTask.distributorName),
                ],
              ),
              _buildCollapsibleSection(
                title: 'Assignment Details',
                icon: Icons.assignment,
                borderColor: Colors.green,
                isExpanded: _isAssignmentExpanded,
                onExpandChanged: (value) {
                  setState(() {
                    _isAssignmentExpanded = value;
                    if (value) {
                      _isCustomerExpanded = false;
                      _isDeviceExpanded = false;
                    }
                  });
                },
                details: [
                  ('Task ID', '#${currentTask.taskId}'),
                  ('Engineer', currentTask.engineerName),
                  ('Assigned By', currentTask.assignedBy),
                  ('Assigned', '${_formatDate(currentTask.assignedTime)} • ${_formatTime(currentTask.assignedTime)}'),
                ],
              ),
              const SizedBox(height: 20),
              if (error != null) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade300),
                  ),
                  child: Text(
                    error!,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: Colors.red.shade700,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _getStatusColor(currentTask.taskStatus),
            _getStatusColor(currentTask.taskStatus).withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _getStatusColor(currentTask.taskStatus).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Task #${currentTask.taskId}',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      currentTask.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  currentTask.statusText,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: _getStatusColor(currentTask.taskStatus),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.location_on,
                  size: 16, color: Colors.white.withOpacity(0.8)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  currentTask.address.fullAddress.isEmpty
                      ? 'No address'
                      : currentTask.address.fullAddress,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.8),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCollapsibleSection({
    required String title,
    required List<(String, String)> details,
    required bool isExpanded,
    required Function(bool) onExpandChanged,
    required Color borderColor,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.dividerColor, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              onExpandChanged(!isExpanded);
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: borderColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      icon,
                      color: borderColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimaryColor,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isExpanded ? 'Tap to collapse' : 'Tap to expand',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppTheme.textSecondaryColor,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: borderColor,
                    size: 26,
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded)
            Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppTheme.dividerColor,
                    width: 0.5,
                  ),
                ),
              ),
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(
                children: details
                    .asMap()
                    .entries
                    .map((entry) {
                      int index = entry.key;
                      var (label, value) = entry.value;
                      bool isLast = index == details.length - 1;
                      return Container(
                        decoration: BoxDecoration(
                          border: isLast
                              ? null
                              : Border(
                                  bottom: BorderSide(
                                    color: AppTheme.dividerColor.withValues(alpha: 0.5),
                                    width: 0.5,
                                  ),
                                ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                label,
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppTheme.textSecondaryColor,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  value,
                                  textAlign: TextAlign.right,
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimaryColor,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    })
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  String _formatStatusName(String action) {
    final statusMap = {
      'created': 'Task Created',
      'assigned': 'Assigned',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'in_progress': 'In Progress',
    };
    return statusMap[action.toLowerCase()] ?? action.replaceAll('_', ' ');
  }

  Widget _buildActionButtons() {
    if (currentTask.taskStatus == 'assigned') {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade500,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: isLoading ? null : _showRejectDialog,
              child: Text(
                'Reject',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: CustomButton(
              text: 'Accept',
              onPressed: isLoading ? () {} : _acceptTask,
            ),
          ),
        ],
      );
    } else if (currentTask.taskStatus == 'accepted') {
      bool needsConfig = currentTask.configStatus == null || currentTask.configStatus == false;

      if (needsConfig) {
        return CustomButton(
          text: 'Configure Device',
          onPressed: isLoading ? () {} : () => _showBluetoothConfigScreen(),
        );
      } else {
        return CustomButton(
          text: 'Complete Task',
          onPressed: isLoading ? () {} : _showCompleteTaskDialog,
        );
      }
    }
    return const SizedBox.shrink();
  }

  void _showBluetoothConfigScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BluetoothConfigScreen(
          task: currentTask,
          engineerId: widget.engineerId,
          onConfigSuccess: () {
            setState(() {
              currentTask.configStatus = true;
            });
            widget.onTaskUpdated();
          },
        ),
      ),
    );
  }

  String _formatDate(DateTime utcDateTime) {
    DateTime ist = utcDateTime.toUtc().add(const Duration(hours: 5, minutes: 30));
    return DateFormat('dd/MM/yyyy').format(ist);
  }

  String _formatTime(DateTime utcDateTime) {
    DateTime ist = utcDateTime.toUtc().add(const Duration(hours: 5, minutes: 30));
    return DateFormat('hh:mm a').format(ist);
  }

  String _formatDateTime(DateTime utcDateTime) {
    DateTime ist = utcDateTime.toUtc().add(const Duration(hours: 5, minutes: 30));
    return DateFormat('dd/MM/yyyy hh:mm a').format(ist);
  }

  String _getServiceTypeName(int type) {
    switch (type) {
      case 1:
        return 'Maintenance';
      case 2:
        return 'Repair';
      case 3:
        return 'Replacement';
      case 4:
        return 'Installation';
      default:
        return 'Unknown';
    }
  }

  IconData _getHistoryIcon(String action) {
    switch (action.toLowerCase()) {
      case 'created':
        return Icons.add_circle;
      case 'assigned':
        return Icons.assignment;
      case 'accepted':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'completed':
        return Icons.task_alt;
      default:
        return Icons.info;
    }
  }

  Color _getActionColor(String action) {
    switch (action.toLowerCase()) {
      case 'created':
        return Colors.grey;
      case 'assigned':
        return Colors.blue;
      case 'accepted':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      case 'completed':
        return Colors.green;
      default:
        return Colors.blueGrey;
    }
  }
}
