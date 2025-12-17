import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../themes/app_theme.dart';
import '../services/token_storage.dart';
import '../models/service_model.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final ApiService _apiService = ApiService();
  String _userName = 'User';

  DashboardAnalytics? _dashboardData;
  String _selectedPeriod = 'today';
  bool _isLoadingDashboard = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _animationController.forward();
    _loadUserData();
    _loadDashboardData();
  }

  Future<void> _loadUserData() async {
    final user = await TokenStorage.getUser();
    if (user != null) {
      setState(() {
        _userName = user['name'] ?? 'User';
      });
    }
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoadingDashboard = true);
    try {
      final data = await _apiService.getDashboardAnalytics();
      setState(() {
        _dashboardData = data;
        _isLoadingDashboard = false;
      });
    } catch (e) {
      print('Error loading dashboard data: $e');
      setState(() => _isLoadingDashboard = false);
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
        title: const Text('Home'),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: () {},
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.2),
                ),
                child: const Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeTransition(
              opacity: Tween<double>(begin: 0.0, end: 1.0)
                  .animate(_animationController),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.2),
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
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome, $_userName👋',
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ready to serve and support customers',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        // mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildStatusCard(
                            icon: Icons.check_circle,
                            label: 'Status',
                            value: 'Active',
                          ),
                          const SizedBox(
                            width: 12,
                          ),
                          _buildStatusCard(
                            icon: Icons.calendar_today,
                            label: 'Next Service',
                            value: 'In 10 days',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Actions',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimaryColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildQuickActionCard(
                          icon: Icons.build_outlined,
                          label: 'Service',
                          onTap: () {
                            Navigator.of(context).pushNamed('/service');
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildQuickActionCard(
                          icon: Icons.history,
                          label: 'History',
                          onTap: () {
                            Navigator.of(context).pushNamed('/service-history');
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tasks Analysis',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimaryColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildPeriodTabs(),
                  const SizedBox(height: 20),
                  if (_isLoadingDashboard)
                    const Center(child: CircularProgressIndicator())
                  else if (_dashboardData != null)
                    _buildAnalyticsCards(_dashboardData)
                  else
                    Center(
                      child: Text(
                        'No data available',
                        style: GoogleFonts.poppins(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  _buildUpcomingSection(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: 0,
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
              break;
            case 1:
              Navigator.of(context).pushNamed('/service');
              break;
            case 2:
              Navigator.of(context).pushNamed('/settings');
              break;
          }
        },
      ),
    );
  }

  Widget _buildStatusCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withOpacity(0.2),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: Colors.white.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.primaryColor.withOpacity(0.3),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryColor,
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimaryColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodTabs() {
    final periods = ['today', 'week', 'month', 'year'];
    final labels = ['Today', 'Weekly', 'Monthly', 'Yearly'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(
          periods.length,
          (index) => Padding(
            padding:
                EdgeInsets.only(right: index < periods.length - 1 ? 12 : 0),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedPeriod = periods[index];
                });
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: _selectedPeriod == periods[index]
                      ? LinearGradient(
                          colors: [
                            AppTheme.primaryColor,
                            AppTheme.primaryDarkColor,
                          ],
                        )
                      : null,
                  color: _selectedPeriod == periods[index]
                      ? null
                      : Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(25),
                  border: _selectedPeriod == periods[index]
                      ? null
                      : Border.all(
                          color: Colors.grey.withOpacity(0.3),
                        ),
                ),
                child: Text(
                  labels[index],
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _selectedPeriod == periods[index]
                        ? Colors.white
                        : AppTheme.textPrimaryColor,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAnalyticsCards(DashboardAnalytics? data) {
    if (data == null) {
      return const SizedBox.shrink();
    }

    switch (_selectedPeriod) {
      case 'today':
        return _buildHourlyChart(data.currentDay);
      case 'week':
        return _buildWeeklyChart(data.currentWeek);
      case 'month':
        return _buildMonthlyChart(data.currentYear);
      case 'year':
        return _buildYearlyChart(data.yearly);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildHourlyChart(DayPeriodAnalytics dayData) {
    final hoursWithData = <int>[];
    final completedSpots = <FlSpot>[];
    final acceptedSpots = <FlSpot>[];
    final rejectedSpots = <FlSpot>[];

    for (int i = 0; i < 24; i++) {
      final stats = dayData.hours[i];
      if (stats != null && stats.total > 0) {
        hoursWithData.add(i);
        completedSpots.add(
            FlSpot(hoursWithData.length - 1.0, stats.completed.toDouble()));
        acceptedSpots
            .add(FlSpot(hoursWithData.length - 1.0, stats.accepted.toDouble()));
        rejectedSpots
            .add(FlSpot(hoursWithData.length - 1.0, stats.rejected.toDouble()));
      }
    }

    if (hoursWithData.isEmpty) {
      return _buildEmptyChart('No hourly data available');
    }

    final maxValue = [
      ...completedSpots.map((e) => e.y),
      ...acceptedSpots.map((e) => e.y),
      ...rejectedSpots.map((e) => e.y),
    ].reduce((a, b) => a > b ? a : b);

    return _buildChartCard(
      title: 'Hourly Analysis',
      subtitle: dayData.date,
      stats: dayData.total,
      chart: _buildLineChart(
        completedSpots: completedSpots,
        acceptedSpots: acceptedSpots,
        rejectedSpots: rejectedSpots,
        maxValue: maxValue,
        maxX: (hoursWithData.length - 1).toDouble(),
        xLabels: hoursWithData.map((h) => '${h}h').toList(),
      ),
    );
  }

  Widget _buildWeeklyChart(WeekPeriodAnalytics weekData) {
    final dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    final completedSpots = <FlSpot>[];
    final acceptedSpots = <FlSpot>[];
    final rejectedSpots = <FlSpot>[];

    for (int i = 0; i < dayNames.length; i++) {
      final stats = weekData.days[dayNames[i]];
      completedSpots
          .add(FlSpot(i.toDouble(), (stats?.completed ?? 0).toDouble()));
      acceptedSpots
          .add(FlSpot(i.toDouble(), (stats?.accepted ?? 0).toDouble()));
      rejectedSpots
          .add(FlSpot(i.toDouble(), (stats?.rejected ?? 0).toDouble()));
    }

    final maxValue = [
      ...completedSpots.map((e) => e.y),
      ...acceptedSpots.map((e) => e.y),
      ...rejectedSpots.map((e) => e.y),
    ].reduce((a, b) => a > b ? a : b);

    return _buildChartCard(
      title: 'Weekly Analysis',
      subtitle: weekData.weekRange,
      stats: weekData.total,
      chart: _buildLineChart(
        completedSpots: completedSpots,
        acceptedSpots: acceptedSpots,
        rejectedSpots: rejectedSpots,
        maxValue: maxValue,
        maxX: 6.0,
        xLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      ),
    );
  }

  Widget _buildMonthlyChart(MonthPeriodAnalytics monthData) {
    final monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    final completedSpots = <FlSpot>[];
    final acceptedSpots = <FlSpot>[];
    final rejectedSpots = <FlSpot>[];

    for (int i = 0; i < monthNames.length; i++) {
      final stats = monthData.months[monthNames[i]];
      completedSpots
          .add(FlSpot(i.toDouble(), (stats?.completed ?? 0).toDouble()));
      acceptedSpots
          .add(FlSpot(i.toDouble(), (stats?.accepted ?? 0).toDouble()));
      rejectedSpots
          .add(FlSpot(i.toDouble(), (stats?.rejected ?? 0).toDouble()));
    }

    final maxValue = [
      ...completedSpots.map((e) => e.y),
      ...acceptedSpots.map((e) => e.y),
      ...rejectedSpots.map((e) => e.y),
    ].reduce((a, b) => a > b ? a : b);

    return _buildChartCard(
      title: 'Monthly Analysis',
      subtitle: 'Year ${monthData.year}',
      stats: monthData.total,
      chart: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          width: 900,
          child: _buildLineChart(
            completedSpots: completedSpots,
            acceptedSpots: acceptedSpots,
            rejectedSpots: rejectedSpots,
            maxValue: maxValue,
            maxX: 11.0,
            xLabels: [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec'
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildYearlyChart(YearlyAnalytics yearlyData) {
    final years = yearlyData.years.keys.toList()..sort();
    if (years.isEmpty) {
      return _buildEmptyChart('No yearly data available');
    }

    final completedSpots = <FlSpot>[];
    final acceptedSpots = <FlSpot>[];
    final rejectedSpots = <FlSpot>[];

    for (int i = 0; i < years.length; i++) {
      final stats = yearlyData.years[years[i]];
      completedSpots
          .add(FlSpot(i.toDouble(), (stats?.completed ?? 0).toDouble()));
      acceptedSpots
          .add(FlSpot(i.toDouble(), (stats?.accepted ?? 0).toDouble()));
      rejectedSpots
          .add(FlSpot(i.toDouble(), (stats?.rejected ?? 0).toDouble()));
    }

    final maxValue = [
      ...completedSpots.map((e) => e.y),
      ...acceptedSpots.map((e) => e.y),
      ...rejectedSpots.map((e) => e.y),
    ].reduce((a, b) => a > b ? a : b);

    final totalStats = TaskStats(
      completed: years.fold(
          0, (sum, year) => sum + (yearlyData.years[year]?.completed ?? 0)),
      accepted: years.fold(
          0, (sum, year) => sum + (yearlyData.years[year]?.accepted ?? 0)),
      rejected: years.fold(
          0, (sum, year) => sum + (yearlyData.years[year]?.rejected ?? 0)),
    );

    return _buildChartCard(
      title: 'Yearly Comparison',
      subtitle: 'Year-over-year analysis',
      stats: totalStats,
      chart: _buildLineChart(
        completedSpots: completedSpots,
        acceptedSpots: acceptedSpots,
        rejectedSpots: rejectedSpots,
        maxValue: maxValue,
        maxX: (years.length - 1).toDouble(),
        xLabels: years,
      ),
    );
  }

  Widget _buildChartCard({
    required String title,
    required String subtitle,
    required Widget chart,
    required TaskStats? stats,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 20),
          chart,
          if (stats != null) ...[
            const SizedBox(height: 24),
            _buildStatsRow(stats),
          ],
        ],
      ),
    );
  }

  Widget _buildStatsRow(TaskStats stats) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildCompactStatBadge(
          label: 'Completed',
          value: stats.completed.toString(),
          color: const Color(0xFF4CAF50),
        ),
        _buildCompactStatBadge(
          label: 'Accepted',
          value: stats.accepted.toString(),
          color: const Color(0xFF2196F3),
        ),
        _buildCompactStatBadge(
          label: 'Rejected',
          value: stats.rejected.toString(),
          color: const Color(0xFFF44336),
        ),
      ],
    );
  }

  Widget _buildCompactStatBadge({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppTheme.textSecondaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildLineChart({
    required List<FlSpot> completedSpots,
    required List<FlSpot> acceptedSpots,
    required List<FlSpot> rejectedSpots,
    required double maxValue,
    required double maxX,
    required List<String> xLabels,
  }) {
    final isWeeklyChart = xLabels.length == 7;
    final isMonthlyChart = xLabels.length == 12;
    final bottomReservedSize = isWeeklyChart ? 75.0 : isMonthlyChart ? 60.0 : 50.0;
    final labelFontSize = isWeeklyChart ? 9.0 : isMonthlyChart ? 8.5 : 11.0;
    final rotationAngle = (isWeeklyChart || isMonthlyChart) ? 0.5235987755982988 : 0.0;

    return SizedBox(
      height: (isWeeklyChart || isMonthlyChart) ? 340 : 320,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: (isWeeklyChart || isMonthlyChart) ? 20.0 : 12.0,
          left: 8.0,
          right: 8.0,
        ),
        child: LineChart(
          LineChartData(
            clipData: FlClipData.all(),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: (maxValue > 0 ? maxValue : 1) / 4,
              getDrawingHorizontalLine: (value) {
                return FlLine(
                  color: Colors.grey.withValues(alpha: 0.15),
                  strokeWidth: 1,
                  dashArray: [5, 5],
                );
              },
            ),
            titlesData: FlTitlesData(
              show: true,
              rightTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              topTitles: const AxisTitles(
                sideTitles: SideTitles(showTitles: false),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: bottomReservedSize,
                  interval: 1,
                  getTitlesWidget: (value, meta) {
                    final index = value.toInt();
                    if (index >= 0 && index < xLabels.length) {
                      return SideTitleWidget(
                        axisSide: meta.axisSide,
                        child: Transform.rotate(
                          angle: rotationAngle,
                          child: Padding(
                            padding: EdgeInsets.only(
                              top: (isWeeklyChart || isMonthlyChart) ? 8.0 : 4.0,
                              right: (isWeeklyChart || isMonthlyChart) ? 4.0 : 0.0,
                            ),
                            child: Text(
                              xLabels[index],
                              style: GoogleFonts.poppins(
                                fontSize: labelFontSize,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textSecondaryColor,
                              ),
                              textAlign: TextAlign.start,
                              maxLines: 1,
                            ),
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 40,
                  getTitlesWidget: (value, meta) {
                    return Text(
                      value.toInt().toString(),
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: AppTheme.textSecondaryColor,
                      ),
                    );
                  },
                ),
              ),
            ),
            borderData: FlBorderData(show: false),
            minX: 0,
            maxX: maxX,
            minY: 0,
            maxY: (maxValue > 0 ? maxValue : 1) + 1,
            lineBarsData: [
              _buildLineBarData(completedSpots, const Color(0xFF4CAF50)),
              _buildLineBarData(acceptedSpots, const Color(0xFF2196F3)),
              _buildLineBarData(rejectedSpots, const Color(0xFFF44336)),
            ],
            lineTouchData: LineTouchData(
              enabled: true,
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (touchedSpot) => Colors.grey[800]!,
                tooltipPadding: const EdgeInsets.all(10),
                getTooltipItems: (touchedSpots) {
                  return touchedSpots.map((LineBarSpot touchedBarSpot) {
                    final value = touchedBarSpot.y.toInt();
                    return LineTooltipItem(
                      '$value',
                      GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    );
                  }).toList();
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  LineChartBarData _buildLineBarData(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: color,
      barWidth: 3.5,
      isStrokeCapRound: true,
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(
        show: true,
        color: color.withOpacity(0.08),
      ),
    );
  }

  Widget _buildEmptyChart(String message) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white,
            Colors.grey.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Text(
          message,
          style: GoogleFonts.poppins(
            color: AppTheme.textSecondaryColor,
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upcoming Services',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildHorizontalUpcomingCard(
                  serviceName: 'Monthly\nMaintenance',
                  customerName: 'Pending',
                  daysLeft: 'In 10 days',
                  icon: Icons.build_circle,
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: 12),
                _buildHorizontalUpcomingCard(
                  serviceName: 'Filter\nReplacement',
                  customerName: 'Scheduled',
                  daysLeft: 'In 5 days',
                  icon: Icons.filter_alt,
                  color: const Color(0xFF2196F3),
                ),
                const SizedBox(width: 12),
                _buildHorizontalUpcomingCard(
                  serviceName: 'Quarterly\nInspection',
                  customerName: 'Pending',
                  daysLeft: 'In 15 days',
                  icon: Icons.checklist,
                  color: const Color(0xFFFF9800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalUpcomingCard({
    required String serviceName,
    required String customerName,
    required String daysLeft,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            serviceName,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimaryColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            customerName,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: AppTheme.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              daysLeft,
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
