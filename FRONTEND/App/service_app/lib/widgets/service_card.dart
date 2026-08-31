import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/service_model.dart';
import '../themes/app_theme.dart';

class ServiceCard extends StatelessWidget {
  final TaskModel task;
  final VoidCallback onTap;

  const ServiceCard({
    super.key,
    required this.task,
    required this.onTap,
  });

  Color get statusColor {
    switch (task.taskStatus.toLowerCase()) {
      case 'created':
        return AppTheme.warningColor;
      case 'assigned':
        return AppTheme.primaryColor;
      case 'accepted':
      case 'in_progress':
      case 'inprogress':
        return Colors.orange;
      case 'completed':
        return AppTheme.successColor;
      case 'rejected':
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.primaryColor;
    }
  }

  Icon get typeIcon {
    switch (task.serviceType) {
      case 1:
        return const Icon(Icons.construction, color: AppTheme.primaryColor);
      case 2:
        return const Icon(Icons.handyman, color: AppTheme.primaryColor);
      case 3:
        return const Icon(Icons.cached, color: AppTheme.primaryColor);
      case 4:
        return const Icon(Icons.build, color: AppTheme.primaryColor);
      default:
        return const Icon(Icons.build, color: AppTheme.primaryColor);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
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
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimaryColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          task.customerName,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: AppTheme.textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      task.taskStatus.toUpperCase(),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  typeIcon,
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      task.modelName.isNotEmpty ? task.modelName : 'Water Purifier',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimaryColor,
                      ),
                    ),
                  ),
                ],
              ),
              if (task.address.fullAddress.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        task.address.fullAddress,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: AppTheme.textSecondaryColor,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
