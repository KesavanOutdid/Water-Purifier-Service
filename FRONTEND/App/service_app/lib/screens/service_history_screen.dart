import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/service_model.dart';
import '../services/api_service.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';

class ServiceHistoryScreen extends StatefulWidget {
  const ServiceHistoryScreen({Key? key}) : super(key: key);

  @override
  State<ServiceHistoryScreen> createState() => _ServiceHistoryScreenState();
}

class _ServiceHistoryScreenState extends State<ServiceHistoryScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final ApiService _apiService = ApiService();
  late String engineerId;
  String? selectedFilter;
  bool isLoading = false;
  List<TaskModel> allTasks = [];
  String? error;
  int currentPage = 1;
  int pageSize = 10;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animationController.forward();
    _getEngineerIdAndFetchHistory();
  }

  Future<void> _getEngineerIdAndFetchHistory() async {
    try {
      final user = await _apiService.getUser();
      if (user != null) {
        engineerId = user['user_id'] ?? user['id'] ?? '';
        _fetchHistory();
      }
    } catch (e) {
      setState(() {
        error = 'Failed to get engineer info';
      });
    }
  }

  Future<void> _fetchHistory() async {
    if (isLoading) return;
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.getEngineerHistory(
        engineerId: engineerId,
      );

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        List<dynamic> tasksList = [];
        
        if (data is Map) {
          if (data['assigned'] != null) {
            tasksList.addAll(data['assigned'] as List);
          }
          if (data['accepted'] != null) {
            tasksList.addAll(data['accepted'] as List);
          }
          if (data['inProgress'] != null) {
            tasksList.addAll(data['inProgress'] as List);
          }
          if (data['completed'] != null) {
            tasksList.addAll(data['completed'] as List);
          }
          if (data['rejected'] != null) {
            tasksList.addAll(data['rejected'] as List);
          }
        } else if (data is List) {
          tasksList = data;
        }
        
        final List<TaskModel> fetchedTasks = tasksList
            .map((task) => TaskModel.fromJson(task))
            .toList();

        setState(() {
          allTasks = fetchedTasks;
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
        });
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Failed to load history',
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

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  List<TaskModel> get filteredTasks {
    if (selectedFilter == null) {
      return allTasks;
    }
    return allTasks.where((task) => task.taskStatus == selectedFilter).toList();
  }

  Color _getStatusColor(String taskStatus) {
    switch (taskStatus) {
      // case 'created':
      //   return Colors.grey;
      // case 'assigned':
      //   return Colors.blue;
      // case 'accepted':
      //   return Colors.orange;
      // case 'inProgress':
      //   return Colors.amber;
      case 'completed':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      // case 'created':
      //   return 'Created';
      // case 'assigned':
      //   return 'Assigned';
      // case 'accepted':
      //   return 'Accepted';
      // case 'inProgress':
      //   return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service History'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: FadeTransition(
        opacity: Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(_animationController),
        child: error != null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      error!,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        color: AppTheme.textSecondaryColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: _fetchHistory,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              )
            : isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Filter by Status',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimaryColor,
                              ),
                            ),
                            Text(
                              '${filteredTasks.length} Tasks',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.textSecondaryColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _buildFilterChip(null, 'All'),
                              // _buildFilterChip('created', 'Created'),
                              // _buildFilterChip('assigned', 'Assigned'),
                              // _buildFilterChip('accepted', 'Accepted'),
                              _buildFilterChip('completed', 'Completed'),
                              _buildFilterChip('rejected', 'Rejected'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: filteredTasks.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.history,
                                  size: 64,
                                  color: Colors.grey.shade300,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No history available',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimaryColor,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'You will see your history here',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: AppTheme.textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchHistory,
                            child: ListView(
                              padding: const EdgeInsets.all(16),
                              children: [
                                ...List.generate(filteredTasks.length, (index) {
                                  return SlideTransition(
                                    position:
                                        Tween<Offset>(
                                          begin: const Offset(0.3, 0),
                                          end: Offset.zero,
                                        ).animate(
                                          CurvedAnimation(
                                            parent: _animationController,
                                            curve: Interval(
                                              0.3 + (index * 0.08),
                                              1.0,
                                              curve: Curves.easeOut,
                                            ),
                                          ),
                                        ),
                                    child: Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 12,
                                      ),
                                      child: GestureDetector(
                                        onTap: () => _showTaskDetails(
                                          filteredTasks[index],
                                        ),
                                        child: _buildHistoryCard(
                                          filteredTasks[index],
                                        ),
                                      ),
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildFilterChip(String? status, String label) {
    bool isSelected = selectedFilter == status;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedFilter = isSelected ? null : status;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : AppTheme.dividerColor,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isSelected ? Colors.white : AppTheme.textPrimaryColor,
            ),
          ),
        ),
      ),
    );
  }

  String _formatDateTime(DateTime utcDateTime) {
    DateTime ist = utcDateTime.toUtc().add(const Duration(hours: 5, minutes: 30));
    return DateFormat('dd/MM/yyyy hh:mm a').format(ist);
  }

  String _getStatusDateText(TaskModel task) {
    switch (task.taskStatus) {
      case 'accepted':
        return 'Accepted: ${task.acceptedTime != null ? _formatDateTime(task.acceptedTime!) : _formatDateTime(task.assignedTime)}';
      case 'completed':
        return 'Completed: ${task.completedTime != null ? _formatDateTime(task.completedTime!) : _formatDateTime(task.assignedTime)}';
      case 'rejected':
        return 'Rejected: ${task.rejectedTime != null ? _formatDateTime(task.rejectedTime!) : _formatDateTime(task.assignedTime)}';
      default:
        return 'Modified: ${_formatDateTime(task.modifiedTime)}';
    }
  }

  Widget _buildHistoryCard(TaskModel task) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
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
                      'Task ID #${task.taskId}',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      task.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimaryColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(task.taskStatus).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getStatusText(task.taskStatus),
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(task.taskStatus),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildAddressRow(task.address),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.devices, size: 16, color: Colors.orange),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  task.modelName,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppTheme.textSecondaryColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _getStatusDateText(task),
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: AppTheme.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressRow(Address address) {
    final List<String> addressParts = [];
    
    if (address.doorno != null && address.doorno!.isNotEmpty) {
      addressParts.add('D.No: ${address.doorno}');
    }
    if (address.street != null && address.street!.isNotEmpty) {
      if (addressParts.isNotEmpty) {
        addressParts[addressParts.length - 1] += ', ${address.street}';
      } else {
        addressParts.add(address.street!);
      }
    }
    
    final List<String> line2Parts = [];
    if (address.city != null && address.city!.isNotEmpty) {
      line2Parts.add(address.city!);
    }
    if (address.district != null && address.district!.isNotEmpty) {
      line2Parts.add(address.district!);
    }
    if (line2Parts.isNotEmpty) {
      addressParts.add(line2Parts.join(', '));
    }
    
    final List<String> line3Parts = [];
    if (address.state != null && address.state!.isNotEmpty) {
      line3Parts.add(address.state!);
    }
    if (address.country != null && address.country!.isNotEmpty) {
      line3Parts.add(address.country!);
    }
    if (address.pincode != null && address.pincode!.isNotEmpty) {
      if (line3Parts.isNotEmpty) {
        addressParts.add('${line3Parts.join(', ')} - ${address.pincode}');
      } else {
        addressParts.add(address.pincode!);
      }
    } else if (line3Parts.isNotEmpty) {
      addressParts.add(line3Parts.join(', '));
    }
    
    final String displayAddress = addressParts.isNotEmpty 
        ? addressParts.join('\n') 
        : 'No address';
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.location_on, size: 16, color: Colors.red),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            displayAddress,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: AppTheme.textSecondaryColor,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  void _showTaskDetails(TaskModel task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.primaryColor,
                        AppTheme.primaryColor.withOpacity(0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.person_outline,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Customer Details',
                          style: GoogleFonts.poppins(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoCard(
                        icon: Icons.numbers,
                        iconColor: Colors.blue,
                        label: 'Task ID',
                        value: '#${task.taskId}',
                      ),
                      const SizedBox(height: 12),
                      _buildInfoCard(
                        icon: Icons.person,
                        iconColor: Colors.purple,
                        label: 'Customer',
                        value: task.customerName,
                      ),
                      const SizedBox(height: 12),
                      _buildPhoneCard(task.phone),
                      const SizedBox(height: 12),
                      _buildInfoCard(
                        icon: Icons.email,
                        iconColor: Colors.orange,
                        label: 'Email',
                        value: task.email,
                      ),
                      const SizedBox(height: 12),
                      _buildInfoCard(
                        icon: Icons.devices,
                        iconColor: Colors.teal,
                        label: 'Device',
                        value: task.modelName,
                      ),
                      const SizedBox(height: 12),
                      _buildStatusCard(task.taskStatus),
                      const SizedBox(height: 12),
                      _buildAddressCard(task.address),
                      const SizedBox(height: 20),
              // if (task.taskHistory.isNotEmpty) ...[
              //   Text(
              //     'Task History',
              //     style: GoogleFonts.poppins(
              //       fontSize: 14,
              //       fontWeight: FontWeight.w600,
              //     ),
              //   ),
              //   const SizedBox(height: 12),
              //   ...task.taskHistory.map((history) {
              //     return Padding(
              //       padding: const EdgeInsets.only(bottom: 12),
              //       child: Container(
              //         padding: const EdgeInsets.all(12),
              //         decoration: BoxDecoration(
              //           color: Colors.grey.shade50,
              //           borderRadius: BorderRadius.circular(8),
              //           border: Border.all(color: AppTheme.dividerColor),
              //         ),
              //         child: Column(
              //           crossAxisAlignment: CrossAxisAlignment.start,
              //           children: [
              //             Text(
              //               history.action.toUpperCase(),
              //               style: GoogleFonts.poppins(
              //                 fontSize: 12,
              //                 fontWeight: FontWeight.w600,
              //                 color: AppTheme.primaryColor,
              //               ),
              //             ),
              //             if (history.toName != null)
              //               Text(
              //                 'To: ${history.toName}',
              //                 style: GoogleFonts.poppins(fontSize: 12),
              //               ),
              //             if (history.reason != null)
              //               Text(
              //                 'Reason: ${history.reason}',
              //                 style: GoogleFonts.poppins(fontSize: 12),
              //               ),
              //             const SizedBox(height: 4),
              //             Text(
              //               _formatDateTime(history.timestamp),
              //               style: GoogleFonts.poppins(
              //                 fontSize: 11,
              //                 color: AppTheme.textSecondaryColor,
              //               ),
              //             ),
              //           ],
              //         ),
              //       ),
              //     );
              //   }).toList(),
              // ],
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    'Close',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhoneCard(String phone) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.phone, size: 20, color: Colors.green),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Phone',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  phone,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimaryColor,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _makePhoneCall(phone),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Call',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(String status) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _getStatusColor(status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              status == 'completed' ? Icons.check_circle : Icons.cancel,
              size: 20,
              color: _getStatusColor(status),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Status',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _getStatusText(status),
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: _getStatusColor(status),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Address address) {
    final List<String> addressLines = [];
    
    if (address.doorno != null && address.doorno!.isNotEmpty) {
      if (address.street != null && address.street!.isNotEmpty) {
        addressLines.add('${address.doorno}, ${address.street}');
      } else {
        addressLines.add(address.doorno!);
      }
    } else if (address.street != null && address.street!.isNotEmpty) {
      addressLines.add(address.street!);
    }
    
    if (address.city != null && address.city!.isNotEmpty) {
      addressLines.add(address.city!);
    }
    
    if (address.district != null && address.district!.isNotEmpty && address.district != address.city) {
      addressLines.add(address.district!);
    }
    
    final List<String> lastLine = [];
    if (address.state != null && address.state!.isNotEmpty) {
      lastLine.add(address.state!);
    }
    if (address.country != null && address.country!.isNotEmpty) {
      lastLine.add(address.country!);
    }
    if (address.pincode != null && address.pincode!.isNotEmpty) {
      lastLine.add(address.pincode!);
    }
    
    if (lastLine.isNotEmpty) {
      addressLines.add(lastLine.join(', '));
    }
    
    final String displayAddress = addressLines.isNotEmpty 
        ? addressLines.join(',\n')
        : 'No address';
    
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor.withOpacity(0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.location_on, size: 20, color: Colors.red),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Address',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  displayAddress,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimaryColor,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimaryColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _phoneDetailRow(String label, String phone) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          Expanded(
            child: Text(
              phone,
              textAlign: TextAlign.end,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimaryColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _makePhoneCall(phone),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Call',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri phoneUri = Uri.parse('tel:$phoneNumber');
    try {
      if (!await launchUrl(
        phoneUri,
        mode: LaunchMode.externalApplication,
      )) {
        throw 'Could not launch phone dialer';
      }
    } catch (e) {
      if (mounted) {
        AlertUtils.showErrorAlert(
          context,
          title: 'Error',
          message: 'Could not open phone dialer',
        );
      }
    }
  }
}
