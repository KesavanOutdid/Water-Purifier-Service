import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:logger/logger.dart';

class BluetoothDeviceService {
  final Logger _logger = Logger();
  static const platform = MethodChannel('com.example.service_app/bluetooth');
  
  bool _isClassicConnected = false;
  BluetoothDevice? _bleDevice;
  BluetoothCharacteristic? _writeCharacteristic;
  BluetoothCharacteristic? _readCharacteristic;
  StreamSubscription<List<int>>? _characteristicSubscription;
  final _responseController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get responseStream => _responseController.stream;

  Future<Map<String, dynamic>> sendConnectHandshake({
    required String bluetoothMac,
    required bool isClassic,
    BluetoothDevice? bleDevice,
  }) async {
    try {
      _logger.i('Sending connect handshake to device: $bluetoothMac');
      
      final command = {
        "command": "connect",
        "bluetooth_mac": bluetoothMac,
        "timestamp": DateTime.now().toUtc().toIso8601String(),
      };

      _logger.d('Connect command: ${jsonEncode(command)}');

      if (isClassic) {
        return await _sendClassicCommand(bluetoothMac, command);
      } else if (bleDevice != null) {
        return await _sendBleCommand(bleDevice, command);
      } else {
        throw Exception('Invalid device configuration');
      }
    } catch (e) {
      _logger.e('Error sending connect handshake: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> sendResetCommand({
    required String bluetoothMac,
    required bool isClassic,
    BluetoothDevice? bleDevice,
  }) async {
    try {
      _logger.i('Sending reset command to device: $bluetoothMac');
      
      final command = {
        "command": "reset",
        "timestamp": DateTime.now().toUtc().toIso8601String(),
      };

      _logger.d('Reset command: ${jsonEncode(command)}');

      if (isClassic) {
        return await _sendClassicCommand(bluetoothMac, command);
      } else if (bleDevice != null) {
        return await _sendBleCommand(bleDevice, command);
      } else {
        throw Exception('Invalid device configuration');
      }
    } catch (e) {
      _logger.e('Error sending reset command: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> _sendClassicCommand(
    String bluetoothMac,
    Map<String, dynamic> command,
  ) async {
    try {
      _logger.i('Sending command via Classic Bluetooth to $bluetoothMac');
      
      await _connectClassicBluetooth(bluetoothMac);

      final commandJson = jsonEncode(command);
      
      _logger.d('Sending command: $commandJson');
      await platform.invokeMethod('sendData', {'data': commandJson});
      
      _logger.i('Command sent, waiting for response...');
      await Future.delayed(const Duration(milliseconds: 500));
      
      final result = await platform.invokeMethod('receiveData');
      
      if (result == null || result['success'] != true) {
        throw Exception('Failed to receive response from device');
      }

      final responseString = result['data'] as String;
      _logger.d('Raw response: $responseString');
      
      final responseJson = jsonDecode(responseString.trim()) as Map<String, dynamic>;
      _logger.i('Parsed response: $responseJson');
      
      _responseController.add(responseJson);
      return responseJson;
    } catch (e) {
      _logger.e('Classic Bluetooth command error: $e');
      await disconnect();
      rethrow;
    }
  }

  Future<void> _connectClassicBluetooth(String bluetoothMac) async {
    try {
      if (!Platform.isAndroid) {
        throw Exception('Classic Bluetooth is only supported on Android');
      }

      _logger.i('Connecting to Classic Bluetooth device: $bluetoothMac');
      
      final result = await platform.invokeMethod('connectClassicBluetooth', {
        'address': bluetoothMac,
        'uuid': '00001101-0000-1000-8000-00805f9b34fb',
      });

      if (result == null || result['success'] != true) {
        throw Exception(result?['error'] ?? 'Failed to connect to Classic Bluetooth');
      }
      
      _isClassicConnected = true;
      _logger.i('Classic Bluetooth connected successfully');
    } catch (e) {
      _logger.e('Classic Bluetooth connection error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> _sendBleCommand(
    BluetoothDevice device,
    Map<String, dynamic> command,
  ) async {
    try {
      _logger.i('Sending command via BLE to ${device.remoteId.str}');
      
      if (_bleDevice == null || _bleDevice!.remoteId != device.remoteId) {
        await _setupBleDevice(device);
      }

      if (_writeCharacteristic == null) {
        throw Exception('BLE write characteristic not found');
      }

      final commandJson = jsonEncode(command);
      final commandBytes = utf8.encode(commandJson);
      
      _logger.d('Sending BLE bytes: ${commandBytes.length}');
      
      final completer = Completer<Map<String, dynamic>>();
      Timer? timeoutTimer;

      final subscription = _responseController.stream.listen((response) {
        if (!completer.isCompleted) {
          timeoutTimer?.cancel();
          completer.complete(response);
        }
      });

      await _writeCharacteristic!.write(commandBytes, withoutResponse: false);
      _logger.i('BLE command written, waiting for response...');

      timeoutTimer = Timer(const Duration(seconds: 10), () {
        if (!completer.isCompleted) {
          subscription.cancel();
          completer.completeError(TimeoutException('Device response timeout'));
        }
      });

      final response = await completer.future;
      await subscription.cancel();
      
      _logger.i('BLE response received: $response');
      return response;
    } catch (e) {
      _logger.e('BLE command error: $e');
      rethrow;
    }
  }

  Future<void> _setupBleDevice(BluetoothDevice device) async {
    try {
      _logger.i('Setting up BLE device: ${device.remoteId.str}');
      _bleDevice = device;

      final services = await device.discoverServices();
      _logger.i('Discovered ${services.length} BLE services');

      for (var service in services) {
        _logger.d('Service UUID: ${service.uuid}');
        
        for (var characteristic in service.characteristics) {
          _logger.d('Characteristic UUID: ${characteristic.uuid}, Properties: ${characteristic.properties}');
          
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            _writeCharacteristic = characteristic;
            _logger.i('Write characteristic found: ${characteristic.uuid}');
          }
          
          if (characteristic.properties.notify || characteristic.properties.indicate) {
            _readCharacteristic = characteristic;
            _logger.i('Read/Notify characteristic found: ${characteristic.uuid}');
            
            await characteristic.setNotifyValue(true);
            _characteristicSubscription = characteristic.lastValueStream.listen((value) {
              if (value.isNotEmpty) {
                try {
                  final responseString = utf8.decode(value);
                  _logger.d('BLE notification received: $responseString');
                  
                  final responseJson = jsonDecode(responseString.trim()) as Map<String, dynamic>;
                  _responseController.add(responseJson);
                } catch (e) {
                  _logger.e('Error parsing BLE notification: $e');
                }
              }
            });
          }
        }
      }

      if (_writeCharacteristic == null) {
        throw Exception('No write characteristic found on device');
      }
      
      _logger.i('BLE device setup completed');
    } catch (e) {
      _logger.e('BLE device setup error: $e');
      rethrow;
    }
  }

  Future<void> disconnect() async {
    try {
      _logger.i('Disconnecting from Bluetooth device...');
      
      await _characteristicSubscription?.cancel();
      _characteristicSubscription = null;
      
      if (_isClassicConnected) {
        try {
          await platform.invokeMethod('disconnectClassicBluetooth');
          _isClassicConnected = false;
          _logger.i('Classic Bluetooth disconnected');
        } catch (e) {
          _logger.e('Error disconnecting Classic Bluetooth: $e');
        }
      }
      
      if (_bleDevice != null) {
        await _bleDevice!.disconnect();
        _bleDevice = null;
        _logger.i('BLE device disconnected');
      }
      
      _writeCharacteristic = null;
      _readCharacteristic = null;
    } catch (e) {
      _logger.e('Error during disconnect: $e');
    }
  }

  void dispose() {
    disconnect();
    _responseController.close();
  }
}
