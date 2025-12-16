import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
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
                      'Task #${task.taskId}',
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
          Row(
            children: [
              Icon(
                Icons.location_on,
                size: 16,
                color: AppTheme.textSecondaryColor,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  task.address.fullAddress.isEmpty
                      ? 'No address'
                      : task.address.fullAddress,
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
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.devices, size: 16, color: AppTheme.textSecondaryColor),
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

  void _showTaskDetails(TaskModel task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Task Details',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _detailRow('Task ID', 'Task #${task.taskId}'),
              _detailRow('Customer', task.customerName),
              _detailRow('Phone', task.phone),
              _detailRow('Email', task.email),
              _detailRow('Device', task.modelName),
              _detailRow('Status', _getStatusText(task.taskStatus)),
              _detailRow('Address', task.address.fullAddress),
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
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
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
}
