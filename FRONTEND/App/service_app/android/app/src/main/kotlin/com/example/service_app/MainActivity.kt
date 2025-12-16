package com.example.service_app

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.IOException
import java.util.UUID

class MainActivity : FlutterActivity() {
  private val CHANNEL = "com.example.service_app/bluetooth"
  private val TAG = "BluetoothBridge"
  private var bluetoothSocket: BluetoothSocket? = null

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
        "connectClassicBluetooth" -> {
          try {
            val address = call.argument<String>("address")
            val uuidString = call.argument<String>("uuid")
            
            if (address == null || uuidString == null) {
              result.error("INVALID_ARGS", "Address and UUID are required", null)
              return@setMethodCallHandler
            }
            
            Log.d(TAG, "Connecting to Classic Bluetooth: $address with UUID: $uuidString")
            val connectionResult = connectToClassicBluetooth(address, uuidString)
            result.success(connectionResult)
          } catch (e: Exception) {
            Log.e(TAG, "Error connecting to Classic Bluetooth: ${e.message}", e)
            result.error("CONNECTION_ERROR", e.message, null)
          }
        }
        "disconnectClassicBluetooth" -> {
          try {
            Log.d(TAG, "Disconnecting Classic Bluetooth")
            disconnectClassicBluetooth()
            result.success(mapOf("success" to true))
          } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting: ${e.message}", e)
            result.error("DISCONNECT_ERROR", e.message, null)
          }
        }
        "sendData" -> {
          try {
            val data = call.argument<String>("data")
            if (data == null) {
              result.error("INVALID_ARGS", "Data is required", null)
              return@setMethodCallHandler
            }
            
            Log.d(TAG, "Sending data via Classic Bluetooth: $data")
            sendData(data)
            result.success(mapOf("success" to true))
          } catch (e: Exception) {
            Log.e(TAG, "Error sending data: ${e.message}", e)
            result.error("SEND_ERROR", e.message, null)
          }
        }
        "receiveData" -> {
          try {
            Log.d(TAG, "Receiving data via Classic Bluetooth")
            val receivedData = receiveData()
            result.success(mapOf("success" to true, "data" to receivedData))
          } catch (e: Exception) {
            Log.e(TAG, "Error receiving data: ${e.message}", e)
            result.error("RECEIVE_ERROR", e.message, null)
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

  private fun connectToClassicBluetooth(address: String, uuidString: String): Map<String, Any> {
    try {
      val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        ?: throw IOException("Bluetooth adapter not available")

      disconnectClassicBluetooth()

      val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(address)
      val uuid = UUID.fromString(uuidString)

      Log.d(TAG, "Creating RFCOMM socket for device: ${device.name} ($address)")
      bluetoothSocket = device.createRfcommSocketToServiceRecord(uuid)

      bluetoothAdapter.cancelDiscovery()

      Log.d(TAG, "Connecting to socket...")
      bluetoothSocket?.connect()

      if (bluetoothSocket?.isConnected == true) {
        Log.d(TAG, "Successfully connected to Classic Bluetooth device")
        return mapOf(
          "success" to true,
          "message" to "Connected successfully",
          "address" to address
        )
      } else {
        throw IOException("Socket connection failed")
      }
    } catch (e: IOException) {
      Log.e(TAG, "IOException during connection: ${e.message}", e)
      disconnectClassicBluetooth()
      throw e
    } catch (e: SecurityException) {
      Log.e(TAG, "SecurityException during connection: ${e.message}", e)
      disconnectClassicBluetooth()
      throw e
    }
  }

  private fun disconnectClassicBluetooth() {
    try {
      bluetoothSocket?.let { socket ->
        if (socket.isConnected) {
          socket.close()
          Log.d(TAG, "Classic Bluetooth socket closed")
        }
        bluetoothSocket = null
      }
    } catch (e: IOException) {
      Log.e(TAG, "Error closing socket: ${e.message}", e)
    }
  }

  private fun sendData(data: String) {
    try {
      val socket = bluetoothSocket ?: throw IOException("Bluetooth socket not connected")
      
      if (!socket.isConnected) {
        throw IOException("Socket is not connected")
      }

      val outputStream = socket.outputStream
      val bytes = data.toByteArray(Charsets.UTF_8)
      
      Log.d(TAG, "Sending ${bytes.size} bytes")
      outputStream.write(bytes)
      outputStream.flush()
      
      Log.d(TAG, "Data sent successfully")
    } catch (e: IOException) {
      Log.e(TAG, "Error sending data: ${e.message}", e)
      throw e
    }
  }

  private fun receiveData(): String {
    try {
      val socket = bluetoothSocket ?: throw IOException("Bluetooth socket not connected")
      
      if (!socket.isConnected) {
        throw IOException("Socket is not connected")
      }

      val inputStream = socket.inputStream
      val buffer = ByteArray(1024)
      
      Log.d(TAG, "Waiting to receive data...")
      val bytesRead = inputStream.read(buffer)
      
      if (bytesRead > 0) {
        val receivedData = String(buffer, 0, bytesRead, Charsets.UTF_8)
        Log.d(TAG, "Received $bytesRead bytes: $receivedData")
        return receivedData
      } else {
        throw IOException("No data received")
      }
    } catch (e: IOException) {
      Log.e(TAG, "Error receiving data: ${e.message}", e)
      throw e
    }
  }

  fun getBluetoothSocket(): BluetoothSocket? {
    return bluetoothSocket
  }
}
