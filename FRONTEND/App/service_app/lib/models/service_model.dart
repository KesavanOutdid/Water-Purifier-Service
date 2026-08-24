enum TaskStatus { created, assigned, accepted, rejected, inProgress, completed }

enum ServiceType { maintenance, repair, replacement, installation }

class Address {
  final String? doorno;
  final String? street;
  final String? city;
  final String? district;
  final String? state;
  final String? country;
  final String? pincode;

  Address({
    this.doorno,
    this.street,
    this.city,
    this.district,
    this.state,
    this.country,
    this.pincode,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      doorno: json['doorno'],
      street: json['street'],
      city: json['city'],
      district: json['district'],
      state: json['state'],
      country: json['country'],
      pincode: json['pincode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'doorno': doorno,
      'street': street,
      'city': city,
      'district': district,
      'state': state,
      'country': country,
      'pincode': pincode,
    };
  }

  String get fullAddress {
    return [doorno, street, city, district, state, pincode]
        .where((e) => e != null && e!.isNotEmpty)
        .join(', ');
  }
}

class TaskHistory {
  final String action;
  final String? from;
  final String? fromName;
  final String? to;
  final String? toName;
  final String? assignedBy;
  final DateTime timestamp;
  final String? reason;

  TaskHistory({
    required this.action,
    this.from,
    this.fromName,
    this.to,
    this.toName,
    this.assignedBy,
    required this.timestamp,
    this.reason,
  });

  factory TaskHistory.fromJson(Map<String, dynamic> json) {
    return TaskHistory(
      action: json['action'] ?? '',
      from: json['from'],
      fromName: json['from_name'],
      to: json['to'],
      toName: json['to_name'],
      assignedBy: json['assigned_by'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      reason: json['reason'],
    );
  }
}

class TaskModel {
  final String id;
  final int taskId;
  final String customerName;
  final Address address;
  final String phone;
  final String email;
  final int serviceType;
  final String modelId;
  final String modelName;
  final String distributorId;
  final String distributorName;
  final String localDistributorId;
  final String localDistributorName;
  final String assignedTo;
  final String engineerName;
  final String assignedBy;
  final DateTime assignedTime;
  final DateTime? acceptedTime;
  final DateTime? completedTime;
  final DateTime? rejectedTime;
  final List<TaskHistory> taskHistory;
  final String createdBy;
  final DateTime createdTime;
  final String modifiedBy;
  final DateTime modifiedTime;
  final bool status;
  final String taskStatus;
  bool? configStatus;
  final bool? waiting;
  final String? waitingReason;
  final List<Map<String, dynamic>>? parts;
  final List<String>? partsUsed;
  final String? deviceId;
  final String? deviceName;

  TaskModel({
    required this.id,
    required this.taskId,
    required this.customerName,
    required this.address,
    required this.phone,
    required this.email,
    required this.serviceType,
    required this.modelId,
    required this.modelName,
    required this.distributorId,
    required this.distributorName,
    required this.localDistributorId,
    required this.localDistributorName,
    required this.assignedTo,
    required this.engineerName,
    required this.assignedBy,
    required this.assignedTime,
    this.acceptedTime,
    this.completedTime,
    this.rejectedTime,
    required this.taskHistory,
    required this.createdBy,
    required this.createdTime,
    required this.modifiedBy,
    required this.modifiedTime,
    required this.status,
    required this.taskStatus,
    this.configStatus,
    this.waiting,
    this.waitingReason,
    this.parts,
    this.partsUsed,
    this.deviceId,
    this.deviceName,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    bool isRejected = json['rejection_reason'] != null &&
        json['rejection_reason'].toString().isNotEmpty;
    String status =
        json['task_status'] ?? (isRejected ? 'rejected' : 'created');

    return TaskModel(
      id: json['_id'] ?? '',
      taskId: json['task_id'] ?? 0,
      customerName: json['customer_name'] ?? '',
      address: json['address'] != null
          ? Address.fromJson(json['address'])
          : Address(),
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      serviceType: json['service_type'] ?? 1,
      modelId: json['model_id'] ?? '',
      modelName: json['model_name'] ?? '',
      distributorId: json['distributor_id'] ?? '',
      distributorName: json['distributor_name'] ?? '',
      localDistributorId: json['local_distributor_id'] ?? '',
      localDistributorName: json['local_distributor_name'] ?? '',
      assignedTo: json['assigned_to'] ?? '',
      engineerName: json['engineer_name'] ?? '',
      assignedBy: json['assigned_by'] ?? '',
      assignedTime: json['assigned_time'] != null
          ? DateTime.parse(json['assigned_time'])
          : (json['rejected_at'] != null
              ? DateTime.parse(json['rejected_at'])
              : DateTime.now()),
      acceptedTime: json['accepted_at'] != null
          ? DateTime.parse(json['accepted_at'])
          : null,
      completedTime: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : (json['completed_time'] != null
              ? DateTime.parse(json['completed_time'])
              : null),
      rejectedTime: json['rejected_at'] != null
          ? DateTime.parse(json['rejected_at'])
          : (json['rejected_time'] != null
              ? DateTime.parse(json['rejected_time'])
              : null),
      taskHistory: json['task_history'] != null
          ? List<TaskHistory>.from((json['task_history'] as List)
              .map((h) => TaskHistory.fromJson(h)))
          : [],
      createdBy: json['created_by'] ?? '',
      createdTime: json['created_time'] != null
          ? DateTime.parse(json['created_time'])
          : DateTime.now(),
      modifiedBy: json['modified_by'] ?? '',
      modifiedTime: json['modified_time'] != null
          ? DateTime.parse(json['modified_time'])
          : DateTime.now(),
      status: json['status'] ?? true,
      taskStatus: status,
      configStatus: json['config_status'] ?? json['configStatus'],
      waiting: json['waiting'],
      waitingReason: json['waiting_reason'],
      parts: json['parts'] != null 
          ? List<Map<String, dynamic>>.from(json['parts'])
          : null,
      partsUsed: json['parts_used'] != null 
          ? List<String>.from(json['parts_used'])
          : null,
      deviceId: json['device_id'],
      deviceName: json['device_name'],
    );
  }

  String get statusColor {
    switch (taskStatus) {
      case 'created':
        return '#9E9E9E';
      case 'assigned':
        return '#2196F3';
      case 'accepted':
        return '#FF9800';
      case 'inProgress':
        return '#FFC107';
      case 'completed':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }

  String get statusText {
    switch (taskStatus) {
      case 'created':
        return 'Created';
      case 'assigned':
        return 'Assigned';
      case 'accepted':
        return 'Accepted';
      case 'inProgress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return taskStatus;
    }
  }
}

class TaskStats {
  final int completed;
  final int accepted;
  final int rejected;

  TaskStats({
    required this.completed,
    required this.accepted,
    required this.rejected,
  });

  factory TaskStats.fromJson(Map<String, dynamic> json) {
    return TaskStats(
      completed: json['completed'] ?? 0,
      accepted: json['accepted'] ?? 0,
      rejected: json['rejected'] ?? 0,
    );
  }

  int get total => completed + accepted + rejected;
}

class DayPeriodAnalytics {
  final String date;
  final Map<int, TaskStats> hours;
  final TaskStats total;

  DayPeriodAnalytics({
    required this.date,
    required this.hours,
    required this.total,
  });

  factory DayPeriodAnalytics.fromJson(Map<String, dynamic> json) {
    final hoursMap = <int, TaskStats>{};
    final hoursJson = json['hours'] as Map<String, dynamic>? ?? {};
    hoursJson.forEach((key, value) {
      hoursMap[int.parse(key)] = TaskStats.fromJson(value);
    });

    return DayPeriodAnalytics(
      date: json['date'] ?? '',
      hours: hoursMap,
      total: TaskStats.fromJson(json['total'] ?? {}),
    );
  }
}

class WeekPeriodAnalytics {
  final String weekRange;
  final Map<String, TaskStats> days;
  final TaskStats total;

  WeekPeriodAnalytics({
    required this.weekRange,
    required this.days,
    required this.total,
  });

  factory WeekPeriodAnalytics.fromJson(Map<String, dynamic> json) {
    final daysMap = <String, TaskStats>{};
    final daysJson = json['days'] as Map<String, dynamic>? ?? {};
    daysJson.forEach((key, value) {
      daysMap[key] = TaskStats.fromJson(value);
    });

    return WeekPeriodAnalytics(
      weekRange: json['week_range'] ?? '',
      days: daysMap,
      total: TaskStats.fromJson(json['total'] ?? {}),
    );
  }
}

class MonthPeriodAnalytics {
  final int year;
  final Map<String, TaskStats> months;
  final TaskStats total;

  MonthPeriodAnalytics({
    required this.year,
    required this.months,
    required this.total,
  });

  factory MonthPeriodAnalytics.fromJson(Map<String, dynamic> json) {
    final monthsMap = <String, TaskStats>{};
    final monthsJson = json['months'] as Map<String, dynamic>? ?? {};
    monthsJson.forEach((key, value) {
      monthsMap[key] = TaskStats.fromJson(value);
    });

    return MonthPeriodAnalytics(
      year: json['year'] ?? 0,
      months: monthsMap,
      total: TaskStats.fromJson(json['total'] ?? {}),
    );
  }
}

class YearlyAnalytics {
  final Map<String, TaskStats> years;

  YearlyAnalytics({required this.years});

  factory YearlyAnalytics.fromJson(Map<String, dynamic> json) {
    final yearsMap = <String, TaskStats>{};
    json.forEach((key, value) {
      yearsMap[key] = TaskStats.fromJson(value);
    });
    return YearlyAnalytics(years: yearsMap);
  }
}

class DashboardAnalytics {
  final DayPeriodAnalytics currentDay;
  final WeekPeriodAnalytics currentWeek;
  final MonthPeriodAnalytics currentYear;
  final YearlyAnalytics yearly;

  DashboardAnalytics({
    required this.currentDay,
    required this.currentWeek,
    required this.currentYear,
    required this.yearly,
  });

  factory DashboardAnalytics.fromJson(Map<String, dynamic> json) {
    return DashboardAnalytics(
      currentDay: DayPeriodAnalytics.fromJson(json['current_day'] ?? {}),
      currentWeek: WeekPeriodAnalytics.fromJson(json['current_week'] ?? {}),
      currentYear: MonthPeriodAnalytics.fromJson(json['current_year'] ?? {}),
      yearly: YearlyAnalytics.fromJson(json['yearly'] ?? {}),
    );
  }
}
