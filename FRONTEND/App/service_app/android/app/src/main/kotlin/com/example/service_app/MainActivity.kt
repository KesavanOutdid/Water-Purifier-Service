package com.example.service_app

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
  private val CHANNEL = "com.example.service_app/bluetooth"
  private val TAG = "BluetoothBridge"

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
      when (call.method) {
        "getPairedDevices" -> {
          try {
            Log.d(TAG, "getPairedDevices called")
            val pairedDevices = getPairedBluetoothDevices()
            Log.d(TAG, "Returning ${pairedDevices.size} devices")
            result.success(pairedDevices)
          } catch (e: Exception) {
            Log.e(TAG, "Error getting paired devices: ${e.message}", e)
            result.error("ERROR", e.message, null)
          }
        }
        else -> result.notImplemented()
      }
    }
  }

  private fun getPairedBluetoothDevices(): List<Map<String, String>> {
    val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
    val devices = mutableListOf<Map<String, String>>()
    
    Log.d(TAG, "BluetoothAdapter: ${if (bluetoothAdapter != null) "available" else "null"}")
    
    if (bluetoothAdapter != null) {
      try {
        val bondedDevices: Set<BluetoothDevice> = bluetoothAdapter.bondedDevices
        Log.d(TAG, "Found ${bondedDevices.size} bonded devices")
        
        for (device in bondedDevices) {
          Log.d(TAG, "Processing device: ${device.name} (${device.address}), type: ${device.type}, class: ${device.bluetoothClass?.deviceClass}")
          
          val deviceMap = mutableMapOf<String, String>()
          deviceMap["name"] = device.name ?: "Unknown Device"
          deviceMap["address"] = device.address
          
          val type = when (device.type) {
            1 -> "BR/EDR"
            2 -> "BLE"
            3 -> "DUAL"
            else -> "UNKNOWN"
          }
          deviceMap["type"] = type
          Log.d(TAG, "Adding device: ${deviceMap["name"]} with type: $type")
          devices.add(deviceMap)
        }
      } catch (e: SecurityException) {
        Log.e(TAG, "SecurityException accessing bonded devices: ${e.message}")
      }
    }
    
    Log.d(TAG, "Total devices to return: ${devices.size}")
    devices.forEach {
      Log.d(TAG, "Device: ${it["name"]} (${it["address"]}) - Type: ${it["type"]}")
    }
    
    return devices
  }
}
