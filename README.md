# Water Purifier Service Management System

A multi-platform ecosystem for managing water purifier lifecycles, service tasks, and hardware diagnostics.

---

## 🏛️ Administrative Hierarchy (Role-Based Access Control)

The system operates on a structured 3-tier hierarchy to ensure efficient regional and local operations.

### **1. Super Admin (Global Control)**
*   **Access**: Full system permissions.
*   **Responsibilities**:
    *   Manage global **Distributors**.
    *   Define hardware **Models** and register unique **Devices**.
    *   Configure global **RBAC** (Roles and Permissions).
    *   System-wide analytics and audit logs.

### **2. Distributor (Regional Level)**
*   **Access**: Regional scoped access.
*   **Responsibilities**:
    *   Accept device assignments from Super Admin.
    *   Onboard and manage **Local Distributors** within their assigned region.
    *   Allocate devices and hardware resources to Local Distributors.
    *   Monitor regional service fulfillment.

### **3. Local Distributor (Local/City Level)**
*   **Access**: Local territory access.
*   **Responsibilities**:
    *   Directly manage the **Technician/Engineer** workforce.
    *   Assign specific **Installation** and **Service** tasks to field engineers.
    *   Maintain local inventory of spare parts.
    *   Ensure customer service SLAs are met.

---

## 📱 Technician App Workflow

The Flutter-based Service App provides field engineers with the tools to perform on-site tasks.

*   **Authentication**: Secure login via **Email** and a **4-digit PIN**.
*   **Task Management**:
    1.  **View Assigned Tasks**: List of installation or repair jobs.
    2.  **Lifecycle Control**: Accept, Reject (with reason), or mark as "Waiting" (e.g., if the customer is not home).
    3.  **Task Execution**: Scan the device **QR Code** for instant ID verification.
    4.  **Parts Usage**: Log replacement parts used during service from the inventory list.
    5.  **Evidence Submission**: Mandatory upload of up to **3 photos** representing the work done.
    6.  **Completion**: Finalize the task, which instantly updates the Admin Dashboard.

---

## 🔌 Bluetooth Hardware Configuration (Technical Guide)

The app communicates with the water purifier hardware using both **BLE** and **Bluetooth Classic**.

### **Communication Protocol**
Commands are sent as **JSON-encoded strings** over the Bluetooth serial/characteristic channel.

#### **1. Connection Handshake**
Ensures secure pairing and authentication between the app and the hardware.
```json
{
  "command": "connect",
  "bluetooth_mac": "XX:XX:XX:XX:XX:XX",
  "timestamp": "2024-02-11T10:38:26Z"
}
```

#### **2. Device Reset Command**
Used by engineers after filter replacements or system maintenance to reset internal timers.
```json
{
  "command": "reset",
  "timestamp": "2024-02-11T10:38:26Z"
}
```

### **Implementation Snippet (Dart/Flutter)**
```dart
// Example of sending a command via Bluetooth
Future<void> sendBluetoothCommand(String type) async {
  final command = {
    "command": type,
    "timestamp": DateTime.now().toUtc().toIso8601String(),
  };
  
  String jsonCommand = jsonEncode(command);
  List<int> bytes = utf8.encode(jsonCommand);
  
  // Write to BLE characteristic
  await writeCharacteristic.write(bytes);
}
```

### **Technical Parameters**
- **BLE Service UUID**: Auto-discovered via characteristic properties (`write`, `notify`).
- **Classic BT UUID**: `00001101-0000-1000-8000-00805f9b34fb` (Standard Serial SPP).
- **Proximity**: Hardware discovery filtered by **RSSI >= -70dBm** to prevent accidental connections to neighboring devices.

---

## 🛠️ Technology Stack Recap
- **Backend**: Node.js, Express, MongoDB, Redis.
- **Admin Dash**: Next.js, TypeScript, Tailwind.
- **Service App**: Flutter, GetX, Hive, Firebase FCM.

Developed by **Kesavan Outdid**.
