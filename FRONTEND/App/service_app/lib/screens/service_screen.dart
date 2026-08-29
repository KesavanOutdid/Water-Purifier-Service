import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/service_model.dart';
import '../services/api_service.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';
import 'task_detail_screen.dart';

class ServiceScreen extends StatefulWidget {
  const ServiceScreen({Key? key}) : super(key: key);

  @override
  State<ServiceScreen> createState() => _ServiceScreenState();
}

class _ServiceScreenState extends State<ServiceScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final ApiService _apiService = ApiService();
  late String engineerId;
  int currentPage = 1;
  int pageSize = 10;
  bool isLoading = false;
  List<TaskModel> allTasks = [];
  String? error;
  String? selectedFilter;
  int? selectedServiceType;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animationController.forward();
    _getEngineerIdAndFetchTasks();
  }

  Future<void> _getEngineerIdAndFetchTasks() async {
    try {
      final user = await _apiService.getUser();
      if (user != null) {
        engineerId = user['user_id'] ?? user['id'] ?? '';
        _fetchTasks();
      }
    } catch (e) {
      setState(() {
        error = 'Failed to get engineer info';
      });
    }
  }

  Future<void> _fetchTasks() async {
    if (isLoading) return;
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.getEngineerTasks(
        engineerId: engineerId,
      );

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        List<dynamic> tasksList = [];
        
        if (data is Map) {
          if (data['assigned'] != null && (data['assigned'] as List).isNotEmpty) {
            tasksList.addAll(data['assigned'] as List);
          }
          if (data['accepted'] != null && (data['accepted'] as List).isNotEmpty) {
            tasksList.addAll(data['accepted'] as List);
          }
          if (data['inProgress'] != null && (data['inProgress'] as List).isNotEmpty) {
            tasksList.addAll(data['inProgress'] as List);
          }
          if (data['completed'] != null && (data['completed'] as List).isNotEmpty) {
            tasksList.addAll(data['completed'] as List);
          }
          // if (data['rejected'] != null && (data['rejected'] as List).isNotEmpty) {
          //   tasksList.addAll(data['rejected'] as List);
          // }
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
          message: 'Failed to load tasks',
        );
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      AlertUtils.showErrorAlert(
        context,
        title: 'Error',
        message: AlertUtils.getUserFriendlyErrorMessage(e),
      );
    }
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
      // case 'rejected':
      //   return Colors.red;
      default:
        return Colors.grey;
    }
  }

  List<TaskModel> get filteredTasks {
    List<TaskModel> filtered = allTasks;
    
    if (selectedFilter != null) {
      filtered = filtered.where((task) => task.taskStatus == selectedFilter).toList();
    }
    
    if (selectedServiceType != null) {
      filtered = filtered.where((task) => task.serviceType == selectedServiceType).toList();
    }
    
    return filtered;
  }

  Widget _buildServiceTypeChip(int? serviceType, String label) {
    bool isSelected = selectedServiceType == serviceType;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            selectedServiceType = isSelected ? null : serviceType;
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
      // case 'rejected':
      //   return 'Rejected: ${task.rejectedTime != null ? _formatDateTime(task.rejectedTime!) : _formatDateTime(task.assignedTime)}';
      default:
        return 'Assigned: ${_formatDateTime(task.assignedTime)}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Tasks'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        elevation: 0,
      ),
      body: FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0)
            .animate(_animationController),
        child: error != null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline,
                        size: 64, color: Colors.red.shade300),
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
                      onPressed: _fetchTasks,
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
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _buildServiceTypeChip(1, 'Installation'),
                                  _buildServiceTypeChip(2, 'Service'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Filter by Status',
                                  style: GoogleFonts.poppins(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimaryColor,
                                  ),
                                ),
                                Text(
                                  '${filteredTasks.length} Tasks',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: AppTheme.textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildFilterChip(null, 'All'),
                                  _buildFilterChip('assigned', 'Assigned'),
                                  _buildFilterChip('accepted', 'Accepted'),
                                  _buildFilterChip('completed', 'Completed'),
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
                                    Icon(Icons.assignment_ind_outlined,
                                        size: 64, color: Colors.grey.shade300),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No tasks available',
                                      style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.textPrimaryColor,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'You will see your tasks here',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: AppTheme.textSecondaryColor,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : RefreshIndicator(
                                onRefresh: _fetchTasks,
                                child: ListView(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  children: [
                                    ...List.generate(filteredTasks.length, (index) {
                                      return SlideTransition(
                                        position: Tween<Offset>(
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
                                          padding: const EdgeInsets.only(bottom: 10),
                                          child: _buildTaskCard(
                                              filteredTasks[index]),
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

  Widget _buildTaskCard(TaskModel task) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => TaskDetailScreen(
              task: task,
              engineerId: engineerId,
              onTaskUpdated: _fetchTasks,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.dividerColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            )
          ],
        ),
        padding: const EdgeInsets.all(12),
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
                          fontSize: 13,
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(task.taskStatus).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color:
                          _getStatusColor(task.taskStatus).withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    task.statusText,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
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
            _buildPhoneRow(task.phone),
            const SizedBox(height: 8),
            _buildInfoRow(Icons.devices, task.modelName, Colors.orange),
            // if (task.serviceType == 2) ...[
            //   if (task.partsUsed != null && task.partsUsed!.isNotEmpty) ...[
            //     const SizedBox(height: 8),
            //     Wrap(
            //       spacing: 6,
            //       runSpacing: 6,
            //       children: task.partsUsed!.map((partName) {
            //         return Container(
            //           padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            //           decoration: BoxDecoration(
            //             color: Colors.purple.withOpacity(0.1),
            //             borderRadius: BorderRadius.circular(6),
            //             border: Border.all(color: Colors.purple.withOpacity(0.3)),
            //           ),
            //           child: Text(
            //             partName,
            //             style: GoogleFonts.poppins(
            //               fontSize: 11,
            //               fontWeight: FontWeight.w500,
            //               color: Colors.purple,
            //             ),
            //           ),
            //         );
            //       }).toList(),
            //     ),
            //   ] else if (task.parts != null && task.parts!.isNotEmpty) ...[
            //     const SizedBox(height: 8),
            //     Wrap(
            //       spacing: 6,
            //       runSpacing: 6,
            //       children: task.parts!.map((part) {
            //         return Container(
            //           padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            //           decoration: BoxDecoration(
            //             color: Colors.purple.withOpacity(0.1),
            //             borderRadius: BorderRadius.circular(6),
            //             border: Border.all(color: Colors.purple.withOpacity(0.3)),
            //           ),
            //           child: Text(
            //             part['part_name'] ?? '',
            //             style: GoogleFonts.poppins(
            //               fontSize: 11,
            //               fontWeight: FontWeight.w500,
            //               color: Colors.purple,
            //             ),
            //           ),
            //         );
            //       }).toList(),
            //     ),
            //   ],
            // ],
            if (task.waiting == true && 
                task.waitingReason != null &&
                task.waitingReason!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Colors.amber.shade300,
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.pending_actions,
                        size: 14, color: Colors.amber.shade700),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Waiting: ${task.waitingReason}',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.amber.shade900,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    _getStatusDateText(task),
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppTheme.textSecondaryColor,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(Icons.arrow_forward,
                    size: 16, color: AppTheme.primaryColor),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, Color iconColor) {
    return Row(
      children: [
        Icon(icon, size: 16, color: iconColor),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: AppTheme.textSecondaryColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
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
        const SizedBox(width: 8),
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

  Widget _buildPhoneRow(String phone) {
    return Row(
      children: [
        Icon(Icons.phone, size: 16, color: Colors.green),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            phone,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: AppTheme.textSecondaryColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => _makePhoneCall(phone),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color.fromARGB(248, 76, 175, 79),
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
