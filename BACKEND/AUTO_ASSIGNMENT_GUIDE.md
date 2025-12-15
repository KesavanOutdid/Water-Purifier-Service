# Auto Task Assignment System

## Overview

The auto-assignment system automatically assigns tasks to available engineers based on their workload and sends notifications for timeouts and warnings.

## Features

### 1. **Auto-Assignment on Task Creation**
When a task is created with a `local_distributor_id`, the system automatically:
- Finds available engineers under that local distributor
- Checks their current task load (max 20 active tasks)
- Assigns the task to the engineer with the least workload
- Sends a notification to the assigned engineer

### 2. **Acceptance Timeout (45 minutes)**
If an engineer doesn't accept a task within 45 minutes:
- **30 minutes**: First warning notification sent
- **40 minutes**: Final warning notification sent
- **45 minutes**: Task automatically reassigned to another available engineer

### 3. **Completion Timeout (48 hours)**
If an engineer accepts but doesn't complete a task within 48 hours:
- **36 hours**: First warning notification sent
- **44 hours**: Final warning notification sent
- **48 hours**: Task automatically reassigned to another available engineer

### 4. **Rejection Handling**
When an engineer rejects a task:
- Rejection reason is saved to task history
- `rejection_reason` field is cleared for next assignment
- Task is automatically reassigned to another available engineer
- Previous engineer is excluded from reassignment

### 5. **No Engineers Available**
When no engineers are available for assignment or reassignment:
- Task status is set back to `created`
- System logs the situation
- If reassignment fails after acceptance/timeout, the current engineer receives a notification to complete the task

## Task States

```
created → assigned → accepted → in_progress → completed
    ↓         ↓
    └─────────┴──→ rejected → reassigned
```

## Monitoring Jobs

The system runs two background jobs:

### Acceptance Timeout Check
- **Frequency**: Every 5 minutes
- **Checks**: Tasks in `assigned` status for > 45 minutes
- **Actions**: Sends warnings at 30, 40 minutes; reassigns at 45 minutes

### Completion Timeout Check
- **Frequency**: Every 30 minutes
- **Checks**: Tasks in `accepted` or `in_progress` status for > 48 hours
- **Actions**: Sends warnings at 36, 44 hours; reassigns at 48 hours

## Database Schema Changes

### Tasks Collection - New Fields

```javascript
{
  rejection_reason: String | null,
  warnings: {
    acceptance_warning_1: Boolean,
    acceptance_warning_2: Boolean,
    completion_warning_1: Boolean,
    completion_warning_2: Boolean
  }
}
```

### Task History Records

All assignment/reassignment actions are logged in `task_history`:

```javascript
{
  action: 'assign' | 'reassign' | 'accept' | 'reject' | 'complete',
  assigned_to: String (engineer user_id),
  assigned_by: String (user_id or 'system'),
  engineer_name: String,
  timestamp: Date,
  reason: String | null,
  previous_engineer: String (for reassignments),
  previous_engineer_name: String (for reassignments)
}
```

## Configuration

### Timeouts (in `jobs/taskMonitor.js`)

```javascript
const ACCEPTANCE_TIMEOUT_MINUTES = 45;
const WARNING_1_MINUTES = 30;
const WARNING_2_MINUTES = 40;

const COMPLETION_TIMEOUT_HOURS = 48;
const COMPLETION_WARNING_1_HOURS = 36;
const COMPLETION_WARNING_2_HOURS = 44;
```

### Max Task Load (in `services/autoAssignService.js`)

```javascript
const MAX_TASK_LOAD = 20;
```

## API Changes

### Create Task
- Now automatically assigns to an available engineer if `local_distributor_id` is provided
- No changes to request/response format

### Reject Task
- Now automatically reassigns to another engineer after rejection
- No changes to request/response format

## Notifications

### Types of Notifications

1. **task_assigned** - New task assigned
2. **task_reassigned** - Task reassigned with reason
3. **reassignment_warning** - Warning before reassignment (2 warnings)
4. **reassignment_failed** - No engineers available for reassignment

## Testing

### 1. Test Auto-Assignment on Creation

```bash
POST /api/admin/tasks
{
  "customer_name": "Test Customer",
  "address": { ... },
  "phone": "1234567890",
  "email": "test@example.com",
  "service_type": 1,
  "model_id": "MODEL001",
  "local_distributor_id": "LD001",
  "distributor_id": "D001",
  "created_by": "admin"
}
```

**Expected**: Task should be auto-assigned to an available engineer

### 2. Test Rejection Auto-Reassignment

```bash
POST /api/app/tasks/:task_id/reject
{
  "engineer_id": "ENG001",
  "reason": "Not available today"
}
```

**Expected**: Task should be reassigned to another engineer

### 3. Test Acceptance Timeout

1. Create and assign a task
2. Wait 30 minutes → Engineer receives warning #1
3. Wait 40 minutes → Engineer receives warning #2
4. Wait 45 minutes → Task is reassigned

### 4. Test Completion Timeout

1. Create, assign, and accept a task
2. Wait 36 hours → Engineer receives warning #1
3. Wait 44 hours → Engineer receives warning #2
4. Wait 48 hours → Task is reassigned

### 5. Test No Engineers Available

1. Ensure all engineers under a local distributor have 20+ active tasks
2. Create a new task
3. Check task status → Should remain `created`
4. Check logs → Should show "No available engineers found"

## Monitoring Logs

All auto-assignment activities are logged with prefixes:

- `[AUTO-ASSIGN]` - Auto-assignment operations
- `[REASSIGN]` - Reassignment operations
- `[ACCEPTANCE-TIMEOUT]` - Acceptance timeout checks
- `[COMPLETION-TIMEOUT]` - Completion timeout checks
- `[ACCEPTANCE-WARNING-1/2]` - Acceptance warnings
- `[COMPLETION-WARNING-1/2]` - Completion warnings
- `[WARNING]` - General warning notifications
- `[CREATE-TASK]` - Task creation operations
- `[REJECT-TASK]` - Task rejection operations

## Troubleshooting

### Task Not Auto-Assigning

**Check**:
- Task has `local_distributor_id` set
- Engineers exist under that local distributor
- Engineers have FCM tokens configured
- Engineers have < 20 active tasks

### Warnings Not Being Sent

**Check**:
- Task Monitor job is running (check server logs on startup)
- Engineers have valid FCM tokens
- Firebase is properly configured

### Reassignment Not Working

**Check**:
- Other engineers are available (< 20 tasks)
- Engineers belong to the same local distributor
- Task Monitor jobs are running

## Performance Considerations

- Acceptance timeout check runs every 5 minutes
- Completion timeout check runs every 30 minutes
- Auto-assignment operations are non-blocking (fire-and-forget)
- Notifications are sent asynchronously

## Future Enhancements

- Location-based engineer selection
- Priority-based task assignment
- Engineer skill/specialization matching
- Dynamic timeout configuration per task type
- Admin dashboard for monitoring auto-assignments
