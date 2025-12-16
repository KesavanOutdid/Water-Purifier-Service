import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import '../models/service_model.dart';
import '../services/api_service.dart';
import '../themes/app_theme.dart';
import '../utils/alert_utils.dart';

import 'package:logger/logger.dart';

class BluetoothConfigScreen extends StatefulWidget {
  final TaskModel task;
  final String engineerId;
  final VoidCallback onConfigSuccess;

  const BluetoothConfigScreen({
    Key? key,
    required this.task,
    required this.engineerId,
    required this.onConfigSuccess,
  }) : super(key: key);

  @override
  State<BluetoothConfigScreen> createState() => _BluetoothConfigScreenState();
}

class BluetoothDeviceInfo {
  final String address;
  final String name;
  final String type;
  final bool isClassic;
  final BluetoothDevice? bleDevice;
  final BluetoothDevice? btDevice;

  BluetoothDeviceInfo({
    required this.address,
    required this.name,
    required this.type,
    required this.isClassic,
    this.bleDevice,
    this.btDevice,
  });
}

class _BluetoothConfigScreenState extends State<BluetoothConfigScreen> {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  static const platform = MethodChannel('com.example.service_app/bluetooth');
  
  BluetoothDevice? connectedDevice;
  BluetoothDeviceInfo? connectedDeviceInfo;
  List<BluetoothDeviceInfo> availableDevices = [];
  Map<String, DateTime> deviceDiscoveryTimes = {};
  Map<String, int> deviceRssiValues = {};
  Socket? classicBluetoothSocket;
  static const int rssiThreshold = -100;
  static const Duration scanTimeout = Duration(seconds: 15);
  static const int RFCOMM_UUID_SPP = 1;
  bool isScanning = false;
  bool isConnecting = false;
  bool isConfiguring = false;
  bool isResetting = false;
  bool isConnectionSuccessful = false;
  bool isResetSuccessful = false;
  String? selectedBluetoothType;
  String? selectedResetType = 'auto';
  StreamSubscription<List<ScanResult>>? scanSubscription;
  StreamSubscription<BluetoothAdapterState>? adapterStateSubscription;

  @override
  void initState() {
    super.initState();
    _checkBluetoothState();
  }

  @override
  void dispose() {
    scanSubscription?.cancel();
    adapterStateSubscription?.cancel();
    super.dispose();
  }

  Future<void> _checkBluetoothState() async {
    adapterStateSubscription = FlutterBluePlus.adapterState.listen((state) {
      if (state == BluetoothAdapterState.off) {
        AlertUtils.showWarningAlert(
          context,
          title: 'Bluetooth Disabled',
          message: 'Please enable Bluetooth to continue',
        );
      }
    });
  }

  Future<List<BluetoothDeviceInfo>> _getClassicBluetoothDevices() async {
    List<BluetoothDeviceInfo> classicDevices = [];
    try {
      if (!Platform.isAndroid) {
        _logger.i('Not Android platform, skipping classic Bluetooth scan');
        return classicDevices;
      }
      
      _logger.i('Fetching paired classic Bluetooth devices from Android...');
      final List<dynamic> pairedDevices =
          await platform.invokeMethod('getPairedDevices');
      
      _logger.i('MethodChannel returned ${pairedDevices.length} paired devices');
      _logger.d('Raw paired devices response: $pairedDevices');
      
      for (var device in pairedDevices) {
        final String address = device['address']?.toString() ?? '';
        final String name = device['name']?.toString() ?? 'Unknown Device';
        final String type = device['type']?.toString() ?? 'unknown';
        
        _logger.d('Paired Device - Name: $name, Address: $address, Type: $type');
        
        if (type == 'BR/EDR' || type == '1' || type.toUpperCase() == 'DUAL') {
          _logger.i('Adding classic Bluetooth device: $name ($address)');
          classicDevices.add(
            BluetoothDeviceInfo(
              address: address,
              name: name,
              type: 'BR/EDR',
              isClassic: true,
              btDevice: null,
            ),
          );
        } else {
          _logger.d('Skipping device with type: $type (not BR/EDR)');
        }
      }
      _logger.i('Total classic Bluetooth devices found: ${classicDevices.length}');
    } catch (e, stacktrace) {
      _logger.e('Error getting classic Bluetooth devices: $e');
      _logger.e('Stack trace: $stacktrace');
    }
    return classicDevices;
  }

  Future<bool> _requestBluetoothPermissions() async {
    if (Platform.isAndroid) {
      final statuses = await [
        Permission.bluetooth,
        Permission.bluetoothScan,
        Permission.bluetoothConnect,
        Permission.locationWhenInUse,
      ].request();

      return statuses[Permission.bluetoothScan]?.isGranted ?? false;
    }
    return true;
  }

  void _showBluetoothTypeSelection() {
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
              'Select Bluetooth Type',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 24),
            _buildBluetoothTypeOption(
              title: 'Bluetooth Classic (BR/EDR)',
              subtitle: 'Traditional Bluetooth for standard devices',
              icon: Icons.bluetooth,
              type: 'classic',
              onTap: () {
                Navigator.pop(context);
                setState(() => selectedBluetoothType = 'classic');
                _startScanning();
              },
            ),
            const SizedBox(height: 16),
            _buildBluetoothTypeOption(
              title: 'Bluetooth Low Energy (BLE)',
              subtitle: 'Low power Bluetooth for IoT devices',
              icon: Icons.bluetooth_connected,
              type: 'ble',
              onTap: () {
                Navigator.pop(context);
                setState(() => selectedBluetoothType = 'ble');
                _startScanning();
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildBluetoothTypeOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required String type,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.dividerColor),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppTheme.primaryColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
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
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppTheme.textSecondaryColor),
          ],
        ),
      ),
    );
  }

  Future<void> _startScanning() async {
    try {
      final hasPermission = await _requestBluetoothPermissions();
      
      if (!hasPermission) {
        if (mounted) {
          AlertUtils.showErrorAlert(
            context,
            title: 'Permission Denied',
            message: 'Bluetooth permissions are required to scan devices',
          );
        }
        return;
      }

      _logger.i('Starting Bluetooth scan...');
      setState(() => isScanning = true);
      availableDevices.clear();
      deviceDiscoveryTimes.clear();
      deviceRssiValues.clear();

      _logger.i('Step 0: Adding static device (WPB4C81929E748) for testing');
      final waterPurifierDevice = BluetoothDeviceInfo(
        address: '48:E7:29:19:C8:B6',
        name: 'WPB4C81929E748',
        type: 'BR/EDR',
        isClassic: true,
        btDevice: null,
      );
      setState(() {
        availableDevices.add(waterPurifierDevice);
        deviceRssiValues['48:E7:29:19:C8:B6'] = -40;
      });
      _logger.i('✅ Static device added to list: WPB4C81929E748 (48:E7:29:19:C8:B6)');

      _logger.i('Step 1: Scanning for classic Bluetooth (BR/EDR) devices');
      final classicDevices = await _getClassicBluetoothDevices();
      _logger.i('Found ${classicDevices.length} classic Bluetooth devices');
      
      setState(() {
        for (var device in classicDevices) {
          final exists = availableDevices.any((dev) => dev.address == device.address);
          if (!exists) {
            availableDevices.add(device);
          }
        }
      });

      _logger.i('Step 2: Starting BLE scan with timeout: $scanTimeout');
      await FlutterBluePlus.startScan(
        timeout: scanTimeout,
      );

      scanSubscription = FlutterBluePlus.scanResults.listen((results) {
        setState(() {
          _logger.d('BLE Scan results received: ${results.length} devices');
          
          for (ScanResult result in results) {
            final deviceAddress = result.device.remoteId.str;
            final rssi = result.rssi;
            final deviceName = result.device.platformName;

            deviceRssiValues[deviceAddress] = rssi;

            _logger.d('BLE Device - Name: $deviceName, Address: $deviceAddress, RSSI: $rssi');

            if (_isDeviceWithinRange(rssi)) {
              final exists = availableDevices.any(
                (dev) => dev.address == deviceAddress,
              );
              
              if (!exists) {
                _logger.i('Adding BLE device: $deviceName ($deviceAddress)');
                availableDevices.add(
                  BluetoothDeviceInfo(
                    address: deviceAddress,
                    name: deviceName.isEmpty ? 'Unknown Device' : deviceName,
                    type: 'BLE',
                    isClassic: false,
                    bleDevice: result.device,
                  ),
                );
                deviceDiscoveryTimes[deviceAddress] = DateTime.now();
              }
            } else {
              _logger.d('Device $deviceName out of range (RSSI: $rssi < $rssiThreshold)');
            }
          }
          _sortDevices();
          _logger.d('Total devices after BLE scan: ${availableDevices.length}');
        });
      });

      _logger.i('Waiting for BLE scan to complete...');
      await Future.delayed(scanTimeout);
      await FlutterBluePlus.stopScan();
      _logger.i('BLE scan completed. Total devices found: ${availableDevices.length}');
      setState(() => isScanning = false);
    } catch (e) {
      setState(() => isScanning = false);
      _logger.e('Scan error: $e');
      AlertUtils.showErrorAlert(
        context,
        title: 'Scan Error',
        message: 'Error scanning for devices: $e',
      );
    }
  }

  void _sortDevices() {
    availableDevices.sort((a, b) {
      final rssiA = deviceRssiValues[a.address] ?? rssiThreshold;
      final rssiB = deviceRssiValues[b.address] ?? rssiThreshold;
      return rssiB.compareTo(rssiA);
    });
  }

  bool _isDeviceWithinRange(int rssi) {
    return rssi >= rssiThreshold;
  }

  Future<void> _connectToDevice(BluetoothDeviceInfo deviceInfo) async {
    setState(() => isConnecting = true);
    _logger.i('Attempting to connect to device: ${deviceInfo.name} (${deviceInfo.address})');

    try {
      final hasPermission = await _requestBluetoothPermissions();
      
      if (!hasPermission) {
        setState(() => isConnecting = false);
        if (mounted) {
          AlertUtils.showErrorAlert(
            context,
            title: 'Permission Denied',
            message: 'Bluetooth permissions are required to connect',
          );
        }
        return;
      }

      if (deviceInfo.isClassic) {
        _logger.i('Classic Bluetooth (BR/EDR) device detected: ${deviceInfo.name}');
        _logger.i('Establishing direct socket connection to device...');
        
        await _connectClassicBluetooth(deviceInfo);
        
        if (!mounted) return;
        setState(() {
          connectedDeviceInfo = deviceInfo;
          isConnecting = false;
          isConnectionSuccessful = true;
        });
        
        _logger.i('✅ Classic Bluetooth device connected: ${deviceInfo.name}');
        
        AlertUtils.showSuccessAlert(
          context,
          title: 'Classic Bluetooth Connected',
          message: 'Device: ${deviceInfo.name}\n\nSuccessfully connected and ready for configuration.',
        );
      } else if (deviceInfo.bleDevice != null) {
        _logger.i('BLE device detected: ${deviceInfo.name}. Starting connection...');
        
        await deviceInfo.bleDevice!.connect(
          timeout: const Duration(seconds: 15),
          autoConnect: false,
          license: License.free,
        );
        
        _logger.i('Successfully connected to BLE device: ${deviceInfo.name}');
        if (!mounted) return;

        setState(() {
          connectedDevice = deviceInfo.bleDevice;
          connectedDeviceInfo = deviceInfo;
        });

        await _sendDeviceHandshake(deviceInfo);
      } else {
        throw Exception('Invalid device information');
      }
    } catch (e) {
      _logger.e('Connection error: $e');
      if (mounted) {
        setState(() => isConnecting = false);
        AlertUtils.showErrorAlert(
          context,
          title: 'Connection Failed',
          message: 'Failed to connect to ${deviceInfo.name}: $e',
        );
      }
    }
  }

  Future<void> _sendDeviceHandshake(BluetoothDeviceInfo deviceInfo) async {
    try {
      _logger.i('Sending handshake to device: ${deviceInfo.name}');
      final handshakeData = {
        'command': 'connect',
        'bluetooth_mac': deviceInfo.address,
        'device_type': deviceInfo.type,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
      };

      _logger.d('Handshake data: $handshakeData');

      final response = await _apiService.sendDeviceHandshake(
        deviceId: deviceInfo.address,
        taskId: widget.task.taskId,
        engineerId: widget.engineerId,
        handshakeData: handshakeData,
      );

      _logger.d('Handshake response: $response');

      if (mounted) {
        if (response['status'] == 1 || response['success'] == true) {
          _logger.i('Device handshake successful: ${deviceInfo.name}');
          setState(() {
            isConnecting = false;
            isConnectionSuccessful = true;
          });
          
          AlertUtils.showSuccessAlert(
            context,
            title: 'Connection Successful',
            message: '${deviceInfo.name} (${deviceInfo.type}) connected successfully',
          );
        } else {
          throw Exception(response['message'] ?? 'Connection handshake failed');
        }
      }
    } catch (e) {
      _logger.e('Handshake error: $e');
      if (mounted) {
        setState(() => isConnecting = false);
        AlertUtils.showErrorAlert(
          context,
          title: 'Connection Failed',
          message: e.toString(),
        );
      }
    }
  }

  Future<void> _sendResetCommand() async {
    if (connectedDeviceInfo == null) return;

    setState(() => isResetting = true);

    try {
      if (connectedDeviceInfo!.isClassic) {
        _logger.i('Sending reset command via Classic Bluetooth...');
        await _sendClassicBluetoothReset(connectedDeviceInfo!);
      } else {
        _logger.i('Sending reset command via BLE...');
        final resetData = {
          'command': 'reset',
          'reset_type': selectedResetType ?? 'auto',
          'bluetooth_mac': connectedDeviceInfo!.address,
          'timestamp': DateTime.now().toUtc().toIso8601String(),
        };

        final response = await _apiService.sendDeviceReset(
          deviceId: connectedDeviceInfo!.address,
          taskId: widget.task.taskId,
          engineerId: widget.engineerId,
          resetData: resetData,
        );

        if (response['status'] != 1 && response['success'] != true) {
          throw Exception(response['message'] ?? 'Reset command failed');
        }
      }

      if (mounted) {
        setState(() {
          isResetting = false;
          isResetSuccessful = true;
        });
        
        AlertUtils.showSuccessAlert(
          context,
          title: 'Reset Successful',
          message: 'Device reset completed successfully',
          onClose: () {
            widget.onConfigSuccess();
            Navigator.of(context).pop();
          },
        );
      }
    } catch (e) {
      _logger.e('Reset error: $e');
      if (mounted) {
        setState(() => isResetting = false);
        AlertUtils.showErrorAlert(
          context,
          title: 'Reset Failed',
          message: e.toString(),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configure Device'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTaskInfo(),
            const SizedBox(height: 24),
            if (selectedBluetoothType == null)
              _buildBluetoothTypeSelection()
            else if (isConnectionSuccessful)
              _buildResetSection()
            else
              _buildDeviceList(),
          ],
        ),
      ),
    );
  }

  Widget _buildTaskInfo() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Task Details',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 12),
          _buildTaskDetailRow('Task ID', '#${widget.task.taskId}'),
          const SizedBox(height: 8),
          _buildTaskDetailRow('Customer', widget.task.customerName),
          const SizedBox(height: 8),
          _buildTaskDetailRow('Device', widget.task.modelName),
        ],
      ),
    );
  }

  Widget _buildTaskDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: AppTheme.textSecondaryColor,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildBluetoothTypeSelection() {
    return Column(
      children: [
        Text(
          'Select Bluetooth Type',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _showBluetoothTypeSelection,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            'Choose Bluetooth Type',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Available Devices',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            ElevatedButton(
              onPressed: isScanning ? null : _startScanning,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                isScanning ? 'Scanning...' : 'Rescan',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (availableDevices.isEmpty && !isScanning)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.bluetooth_disabled,
                    size: 40,
                    color: AppTheme.textSecondaryColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No devices found',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          SizedBox(
            height: 400,
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: availableDevices.length,
              itemBuilder: (context, index) {
                BluetoothDeviceInfo device = availableDevices[index];
                return _buildDeviceCard(device);
              },
            ),
          ),
      ],
    );
  }

  String _formatDiscoveryTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inSeconds < 60) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else {
      return dateTime.toString().split('.')[0];
    }
  }

  Widget _buildDeviceCard(BluetoothDeviceInfo device) {
    bool isConnected = connectedDevice?.remoteId.str == device.address;
    bool isCurrentlyConnecting = isConnecting && isConnected;
    
    String deviceAddress = device.address;
    String deviceType = device.type;
    String deviceName = device.name;
    DateTime? discoveryTime = deviceDiscoveryTimes[deviceAddress];
    int? rssi = deviceRssiValues[deviceAddress];

    final deviceCard = Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        border: Border.all(
          color: isConnected ? AppTheme.primaryColor : AppTheme.dividerColor,
          width: isConnected ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(12),
        color: isConnected ? AppTheme.primaryColor.withValues(alpha: 0.05) : Colors.white,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            Icon(
              deviceType == 'BR/EDR' ? Icons.computer : Icons.bluetooth_connected,
              color: isConnected ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
              size: 28,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    deviceName,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isConnected ? AppTheme.primaryColor : AppTheme.textPrimaryColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          deviceType,
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDiscoveryTime(discoveryTime),
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        device.address,
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          color: AppTheme.textSecondaryColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(width: 12),
                      if (rssi != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getSignalStrengthColor(rssi).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.signal_cellular_4_bar,
                                size: 12,
                                color: _getSignalStrengthColor(rssi),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '$rssi dBm',
                                style: GoogleFonts.poppins(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: _getSignalStrengthColor(rssi),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (isCurrentlyConnecting)
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                ),
              )
            else if (isConnected)
              const Icon(Icons.check_circle, color: Colors.green, size: 24),
          ],
        ),
      ),
    );

    return GestureDetector(
      onTap: isConnecting || isConfiguring ? null : () => _connectToDevice(device),
      child: deviceCard,
    );
  }

  Color _getSignalStrengthColor(int rssi) {
    if (rssi >= -50) {
      return Colors.green;
    } else if (rssi >= -65) {
      return Colors.blue;
    } else if (rssi >= -75) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }

  Widget _buildResetSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green, width: 1),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Device Connected',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      connectedDeviceInfo?.name ?? 'Unknown Device',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: AppTheme.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Device Reset Configuration',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.dividerColor),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: DropdownButton<String>(
            isExpanded: true,
            value: selectedResetType ?? 'auto',
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(
                value: 'auto',
                child: Text('Auto Select Reset'),
              ),
              DropdownMenuItem(
                value: 'factory',
                child: Text('Factory Reset'),
              ),
              DropdownMenuItem(
                value: 'soft',
                child: Text('Soft Reset'),
              ),
              DropdownMenuItem(
                value: 'hard',
                child: Text('Hard Reset'),
              ),
            ],
            onChanged: (value) {
              if (!isResetting) {
                setState(() => selectedResetType = value);
              }
            },
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: isResetting ? null : _sendResetCommand,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            isResetting ? 'Resetting...' : 'Send Reset Command',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}
