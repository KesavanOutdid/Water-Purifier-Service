# Device Assignment System - Complete Guide

## Overview
This system manages device assignments in a two-level hierarchy:
1. **Distributor Level**: Admin assigns devices to distributors
2. **Local Distributor Level**: Distributor assigns devices to local distributors

## Device Model Structure

```javascript
{
  device_id: number,              // Auto-increment ID
  assigned_to: string | null,     // Distributor ID
  assigned_to_local: string | null, // Local Distributor ID
  assigned_by: string,            // Who performed the last assignment/reassignment/unassignment
  assigned_time: Date,            // When the last assignment/reassignment occurred
  assignment_history: [           // Complete history of all assignments
    {
      action: "assign" | "unassign" | "reassign",
      from: string | null,
      to: string | null,
      assigned_by: string,
      timestamp: Date,
      level: "distributor" | "local_distributor"
    }
  ],
  created_by: string,
  created_time: Date,
  modified_by: string,
  modified_time: Date,
  status: boolean
}
```

**Note**: We use a single `assigned_by` and `assigned_time` field for simplicity. Complete history is tracked in `assignment_history` array.

---

## Assignment Rules

### ✅ Valid Assignment Flow
```
Unassigned Device
    ↓
Admin assigns to Distributor
    ↓
Distributor assigns to Local Distributor
```

### ❌ Invalid Operations
- **Cannot** assign to local distributor if device is not assigned to distributor first
- **Cannot** assign device to distributor if already assigned to another distributor (must reassign or unassign first)
- **Cannot** assign device to local distributor if already assigned to another local distributor (must reassign or unassign first)

---

## API Endpoints

### 1. Assign Device
**Endpoint**: `POST /api/admin/devices/:device_id/assign`

---

## Scenario 1: Fresh Device Assignment (Distributor Only)

### Initial State
```json
{
  "device_id": 1,
  "assigned_to": null,
  "assigned_to_local": null,
  "status": true
}
```

### API Call
```http
POST /api/admin/devices/1/assign
Content-Type: application/json

{
  "level": "distributor",
  "distributor_id": "dist123",
  "assigned_by": "admin@example.com"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": null,
  "assigned_by": "admin@example.com",
  "assigned_time": "2024-01-15T10:30:00.000Z",
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    }
  ],
  "status": true
}
```

✅ **Works perfectly!** Device is now assigned to distributor, local is null.

---

## Scenario 2: Assign Local Distributor (After Distributor Assignment)

### Current State
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": null
}
```

### API Call
```http
POST /api/admin/devices/1/assign
Content-Type: application/json

{
  "level": "local_distributor",
  "local_distributor_id": "local_dist456",
  "assigned_by": "dist123"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist456",
  "assigned_by": "dist123",
  "assigned_time": "2024-01-15T11:00:00.000Z",
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    },
    {
      "action": "assign",
      "from": null,
      "to": "local_dist456",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "level": "local_distributor"
    }
  ],
  "status": true
}
```

✅ **Works!** Device now has both distributor and local distributor assigned.

---

## Scenario 3: Try to Assign Local Without Distributor (ERROR)

### Current State
```json
{
  "device_id": 2,
  "assigned_to": null,
  "assigned_to_local": null
}
```

### API Call
```http
POST /api/admin/devices/2/assign
Content-Type: application/json

{
  "level": "local_distributor",
  "local_distributor_id": "local_dist456",
  "assigned_by": "dist123"
}
```

### Result
```json
{
  "success": false,
  "message": "Device must be assigned to a distributor first"
}
```

❌ **Validation Error**: Cannot assign local distributor without distributor assignment first.

---

## Scenario 4: Reassign Distributor (Clears Local Assignment)

### Current State
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist456"
}
```

### API Call
```http
POST /api/admin/devices/1/reassign
Content-Type: application/json

{
  "level": "distributor",
  "new_distributor_id": "dist789",
  "assigned_by": "admin@example.com"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": "dist789",
  "assigned_by": "admin@example.com",
  "assigned_time": "2024-01-15T12:00:00.000Z",
  "assigned_to_local": null,
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    },
    {
      "action": "assign",
      "from": null,
      "to": "local_dist456",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "level": "local_distributor"
    },
    {
      "action": "reassign",
      "from": "dist123",
      "to": "dist789",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T12:00:00.000Z",
      "level": "distributor"
    }
  ],
  "status": true
}
```

⚠️ **Important**: Reassigning distributor automatically clears local distributor assignment.

---

## Scenario 5: Reassign Local Distributor Only

### Current State
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist456"
}
```

### API Call
```http
POST /api/admin/devices/1/reassign
Content-Type: application/json

{
  "level": "local_distributor",
  "new_local_distributor_id": "local_dist999",
  "assigned_by": "dist123"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist999",
  "assigned_by": "dist123",
  "assigned_time": "2024-01-15T13:00:00.000Z",
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    },
    {
      "action": "assign",
      "from": null,
      "to": "local_dist456",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "level": "local_distributor"
    },
    {
      "action": "reassign",
      "from": "local_dist456",
      "to": "local_dist999",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T13:00:00.000Z",
      "level": "local_distributor"
    }
  ],
  "status": true
}
```

✅ **Works!** Only local distributor is changed, distributor remains the same.

---

## Scenario 6: Unassign Distributor (Clears Everything)

### Current State
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist456"
}
```

### API Call
```http
POST /api/admin/devices/1/unassign
Content-Type: application/json

{
  "level": "distributor",
  "assigned_by": "admin@example.com"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": null,
  "assigned_to_local": null,
  "assigned_by": "admin@example.com",
  "assigned_time": "2024-01-15T14:00:00.000Z",
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    },
    {
      "action": "assign",
      "from": null,
      "to": "local_dist456",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "level": "local_distributor"
    },
    {
      "action": "unassign",
      "from": "dist123",
      "to": null,
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T14:00:00.000Z",
      "level": "distributor"
    }
  ],
  "status": true
}
```

⚠️ **Important**: Unassigning distributor automatically clears local distributor as well.

---

## Scenario 7: Unassign Local Distributor Only

### Current State
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": "local_dist456"
}
```

### API Call
```http
POST /api/admin/devices/1/unassign
Content-Type: application/json

{
  "level": "local_distributor",
  "assigned_by": "dist123"
}
```

### Result
```json
{
  "device_id": 1,
  "assigned_to": "dist123",
  "assigned_to_local": null,
  "assigned_by": "dist123",
  "assigned_time": "2024-01-15T15:00:00.000Z",
  "assignment_history": [
    {
      "action": "assign",
      "from": null,
      "to": "dist123",
      "assigned_by": "admin@example.com",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "distributor"
    },
    {
      "action": "assign",
      "from": null,
      "to": "local_dist456",
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "level": "local_distributor"
    },
    {
      "action": "unassign",
      "from": "local_dist456",
      "to": null,
      "assigned_by": "dist123",
      "timestamp": "2024-01-15T15:00:00.000Z",
      "level": "local_distributor"
    }
  ],
  "status": true
}
```

✅ **Works!** Only local distributor is removed, distributor assignment remains.

---

## Scenario 8: Get Devices by Distributor

### API Call
```http
GET /api/admin/devices/by-assignee?assignee_id=dist123&level=distributor&page=1&limit=10
```

### Result
Returns all devices where `assigned_to = "dist123"` with pagination.

```json
{
  "success": true,
  "data": [
    {
      "device_id": 1,
      "assigned_to": "dist123",
      "assigned_to_local": "local_dist456"
    },
    {
      "device_id": 5,
      "assigned_to": "dist123",
      "assigned_to_local": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Scenario 9: Get Devices by Local Distributor

### API Call
```http
GET /api/admin/devices/by-assignee?assignee_id=local_dist456&level=local_distributor&page=1&limit=10
```

### Result
Returns all devices where `assigned_to_local = "local_dist456"` with pagination.

```json
{
  "success": true,
  "data": [
    {
      "device_id": 1,
      "assigned_to": "dist123",
      "assigned_to_local": "local_dist456"
    },
    {
      "device_id": 3,
      "assigned_to": "dist789",
      "assigned_to_local": "local_dist456"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Scenario 10: Get Assignment History

### API Call
```http
GET /api/admin/devices/1/assignment-history
```

### Result
```json
{
  "success": true,
  "data": {
    "device_id": 1,
    "current_assignment": {
      "distributor": "dist123",
      "local_distributor": "local_dist456"
    },
    "assignment_history": [
      {
        "action": "assign",
        "from": null,
        "to": "dist123",
        "assigned_by": "admin@example.com",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "level": "distributor"
      },
      {
        "action": "assign",
        "from": null,
        "to": "local_dist456",
        "assigned_by": "dist123",
        "timestamp": "2024-01-15T11:00:00.000Z",
        "level": "local_distributor"
      },
      {
        "action": "reassign",
        "from": "local_dist456",
        "to": "local_dist999",
        "assigned_by": "dist123",
        "timestamp": "2024-01-15T13:00:00.000Z",
        "level": "local_distributor"
      }
    ]
  }
}
```

---

## Complete Workflow Example

### Step 1: Create Device
```http
POST /api/admin/devices
{
  "created_by": "admin@example.com"
}
```
**Result**: Device created with `device_id = 1`, unassigned

---

### Step 2: Assign to Distributor
```http
POST /api/admin/devices/1/assign
{
  "level": "distributor",
  "distributor_id": "dist123",
  "assigned_by": "admin@example.com"
}
```
**Result**: Device assigned to `dist123`, local is `null`

---

### Step 3: Assign to Local Distributor
```http
POST /api/admin/devices/1/assign
{
  "level": "local_distributor",
  "local_distributor_id": "local_dist456",
  "assigned_by": "dist123"
}
```
**Result**: Device assigned to `dist123` and `local_dist456`

---

### Step 4: Reassign Local Distributor
```http
POST /api/admin/devices/1/reassign
{
  "level": "local_distributor",
  "new_local_distributor_id": "local_dist999",
  "assigned_by": "dist123"
}
```
**Result**: Device still with `dist123`, but local changed to `local_dist999`

---

### Step 5: Reassign Distributor (Clears Local)
```http
POST /api/admin/devices/1/reassign
{
  "level": "distributor",
  "new_distributor_id": "dist789",
  "assigned_by": "admin@example.com"
}
```
**Result**: Device assigned to `dist789`, local becomes `null` (cleared)

---

## Summary of Key Rules

| Scenario | Allowed? | Notes |
|----------|----------|-------|
| Assign distributor on unassigned device | ✅ Yes | Device gets distributor, local stays null |
| Assign local when distributor exists | ✅ Yes | Device now has both levels assigned |
| Assign local when no distributor | ❌ No | Must assign distributor first |
| Reassign distributor | ✅ Yes | **Clears local assignment** |
| Reassign local distributor | ✅ Yes | Distributor remains unchanged |
| Unassign distributor | ✅ Yes | **Clears local assignment too** |
| Unassign local distributor | ✅ Yes | Distributor remains unchanged |
| Assign distributor when already assigned | ❌ No | Must unassign or reassign first |
| Assign local when already assigned | ❌ No | Must unassign or reassign first |

---

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Device must be assigned to a distributor first` | Trying to assign local without distributor | Assign distributor first |
| `Device is already assigned to a distributor` | Trying to assign distributor when already assigned | Use reassign API instead |
| `Device is already assigned to a local distributor` | Trying to assign local when already assigned | Use reassign API instead |
| `Device is not currently assigned to any distributor` | Trying to reassign distributor on unassigned device | Assign distributor first |
| `Device is not currently assigned to any local distributor` | Trying to reassign local when not assigned | Assign local first |
| `Device not found` | Invalid device_id or device is deleted | Check device_id and status |
| `level is required and must be either "distributor" or "local_distributor"` | Invalid or missing level parameter | Provide valid level |

---

## Best Practices

1. **Always assign distributor first** before assigning local distributor
2. **Check assignment history** to track all changes
3. **Use reassign** when changing assignments, not unassign + assign
4. **Be aware** that reassigning distributor clears local assignment
5. **Use pagination** when fetching devices by assignee for large datasets
6. **Validate assignee IDs** exist in your system before assignment
7. **Log assignment actions** using the `assigned_by` field for audit trails

---

## API Quick Reference

| Operation | Endpoint | Method | Body |
|-----------|----------|--------|------|
| Assign | `/api/admin/devices/:device_id/assign` | POST | `{level, distributor_id/local_distributor_id, assigned_by}` |
| Unassign | `/api/admin/devices/:device_id/unassign` | POST | `{level, assigned_by}` |
| Reassign | `/api/admin/devices/:device_id/reassign` | POST | `{level, new_distributor_id/new_local_distributor_id, assigned_by}` |
| Get by Assignee | `/api/admin/devices/by-assignee` | GET | Query: `?assignee_id=...&level=...&page=1&limit=10` |
| Assignment History | `/api/admin/devices/:device_id/assignment-history` | GET | None |
