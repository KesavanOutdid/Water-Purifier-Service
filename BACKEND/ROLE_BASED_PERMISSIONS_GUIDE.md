# Role-Based Permissions System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Structure](#database-structure)
3. [Architecture Components](#architecture-components)
4. [Implementation Guide](#implementation-guide)
5. [API Reference](#api-reference)
6. [Usage Examples](#usage-examples)
7. [Integration Steps](#integration-steps)

---

## System Overview

This is a complete **Role-Based Access Control (RBAC)** implementation that manages user permissions through:
- **Roles**: Define user types (e.g., Admin, Manager, Technician)
- **Permissions**: Control access to modules and actions (create, view, update, delete)
- **Modules**: Application features that can be protected
- **Users**: Assigned one or more roles to determine their permissions

### Key Features
- ✅ Multi-role support per user
- ✅ Granular CRUD permissions per module
- ✅ Module and submodule support
- ✅ Bulk permission assignment
- ✅ Redis caching for performance
- ✅ Soft delete functionality
- ✅ Audit trail (created_by, modified_by)

---

## Database Structure

### Collections

#### 1. **roles** Collection
Stores role definitions.

```javascript
{
  _id: ObjectId,
  role_id: Number,              // Auto-incrementing unique ID
  role_name: String,            // e.g., "Admin", "Technician"
  created_by: String,           // Email of creator
  created_time: Date,
  modified_by: String | null,   // Email of last modifier
  modified_at: Date | null,
  status: Boolean               // true = active, false = soft deleted
}
```

**Example:**
```json
{
  "_id": ObjectId("..."),
  "role_id": 1,
  "role_name": "Super Admin",
  "created_by": "admin@example.com",
  "created_time": "2024-01-15T10:00:00Z",
  "modified_by": null,
  "modified_at": null,
  "status": true
}
```

---

#### 2. **permissions** Collection
Maps roles to module permissions with CRUD actions.

```javascript
{
  _id: ObjectId,
  role_id: Number,              // Reference to roles.role_id
  module: String,               // e.g., "Dashboard", "Manage Users"
  submodule: String | null,     // e.g., "Manage Installation"
  can_create: Boolean,          // CREATE permission
  can_view: Boolean,            // READ permission
  can_update: Boolean,          // UPDATE permission
  can_delete: Boolean,          // DELETE permission
  status: Boolean,              // Enable/disable permission
  created_at: Date,
  updated_at: Date
}
```

**Example:**
```json
{
  "_id": ObjectId("..."),
  "role_id": 2,
  "module": "Task Management",
  "submodule": "Manage Installation",
  "can_create": true,
  "can_view": true,
  "can_update": false,
  "can_delete": false,
  "status": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

---

#### 3. **users** Collection
Users with assigned roles.

```javascript
{
  _id: ObjectId,
  user_id: String,              // UUID
  name: String,
  email: String,
  password: String,
  roles: [Number],              // Array of role_ids
  role_names: [String],         // Cached role names
  // ... other fields
  status: Boolean
}
```

**Example:**
```json
{
  "_id": ObjectId("..."),
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "roles": [2, 3],
  "role_names": ["Technician", "Manager"],
  "status": true
}
```

---

## Architecture Components

### 1. **Module Configuration** (`config/moduleConfig.js`)

Defines available modules and their actions.

```javascript
const MODULES = [
    {
        module: "Dashboard",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Users",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Task Management",
        submodules: [
            {
                name: "Manage Installation",
                actions: ["create", "view", "update", "delete"]
            },
            {
                name: "Manage Service",
                actions: ["create", "view", "update", "delete"]
            }
        ]
    }
];
```

**Key Points:**
- Top-level modules can have direct actions
- Modules can contain submodules with their own actions
- Actions are standardized: `create`, `view`, `update`, `delete`

---

### 2. **Controllers**

#### **rolesController.js**
Manages role CRUD operations:
- `getRoles()` - List all active roles (paginated)
- `getRoleById(role_id)` - Get single role details
- `createRole()` - Create new role
- `updateRole(role_id)` - Update role name
- `deleteRole(role_id)` - Soft delete role

#### **permissionsController.js**
Manages permissions:
- `getModules()` - Get all modules from config
- `assignBulkPermissions()` - Assign multiple permissions to a role
- `findByRoles(role_ids)` - Get all permissions for specific roles
- `updatePermission(id)` - Update individual permission

#### **usersController.js**
Manages users with role assignment:
- Validates role_ids against roles collection
- Stores `roles` array and cached `role_names` array
- Enforces role existence before user creation/update

---

### 3. **Middleware**

#### **authMiddleware.js**
JWT authentication that extracts user roles:

```javascript
module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.user_id;
    req.roles = decoded.roles || [];  // Available in all protected routes
    next();
};
```

**Usage in routes:**
```javascript
router.get('/protected', authMiddleware, (req, res) => {
    const userRoles = req.roles; // Array of role_ids
    // Check permissions here
});
```

---

## Implementation Guide

### Step 1: Set Up Collections

Create MongoDB collections (auto-created on first insert):
```javascript
// Collections needed:
// - roles
// - permissions  
// - users
```

Run seed script to create initial Super Admin:
```bash
node scripts/seedData.js
```

---

### Step 2: Define Modules

Edit `config/moduleConfig.js` to add your application modules:

```javascript
const MODULES = [
    {
        module: "Products",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Orders",
        submodules: [
            {
                name: "Pending Orders",
                actions: ["view", "update"]
            },
            {
                name: "Completed Orders",
                actions: ["view"]
            }
        ]
    }
];
```

---

### Step 3: Create Roles

**API Request:**
```http
POST /api/admin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_name": "Sales Manager",
  "created_by": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role_id": 5,
    "role_name": "Sales Manager",
    "created_by": "admin@example.com",
    "created_time": "2024-01-15T10:00:00Z",
    "status": true
  }
}
```

---

### Step 4: Assign Permissions to Role

**Bulk Permission Assignment:**

```http
POST /api/admin/permissions/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": 5,
  "permissions": [
    {
      "module": "Products",
      "submodule": null,
      "actions": ["view", "update"],
      "status": true
    },
    {
      "module": "Orders",
      "submodule": "Pending Orders",
      "actions": ["view", "update"],
      "status": true
    },
    {
      "module": "Orders",
      "submodule": "Completed Orders",
      "actions": ["view"],
      "status": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions assigned successfully",
  "data": [
    {
      "action": "created",
      "permission": {
        "role_id": 5,
        "module": "Products",
        "submodule": null,
        "can_create": false,
        "can_view": true,
        "can_update": true,
        "can_delete": false,
        "status": true
      }
    }
  ]
}
```

---

### Step 5: Create Users with Roles

```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "roles": [5],
  "created_by": "admin@example.com"
}
```

**Key Points:**
- `roles` must be an array of valid role_ids
- System validates role existence
- User gets all permissions from assigned roles

---

### Step 6: Check Permissions in Your Code

#### Method 1: Manual Permission Check

```javascript
const checkPermission = async (userRoles, module, submodule, action) => {
    const db = getDB();
    
    const permission = await db.collection('permissions').findOne({
        role_id: { $in: userRoles },
        module: module,
        submodule: submodule || null,
        [`can_${action}`]: true,
        status: true
    });
    
    return !!permission;
};

// Usage in controller
const createProduct = async (req, res) => {
    const hasPermission = await checkPermission(
        req.roles,
        "Products",
        null,
        "create"
    );
    
    if (!hasPermission) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Proceed with product creation
};
```

#### Method 2: Permission Middleware (Recommended)

Create `middleware/permissionMiddleware.js`:

```javascript
const { getDB } = require('../config/database');

const requirePermission = (module, submodule = null, action) => {
    return async (req, res, next) => {
        try {
            const db = getDB();
            
            const permission = await db.collection('permissions').findOne({
                role_id: { $in: req.roles },
                module: module,
                submodule: submodule,
                [`can_${action}`]: true,
                status: true
            });
            
            if (!permission) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action'
                });
            }
            
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error checking permissions',
                error: error.message
            });
        }
    };
};

module.exports = { requirePermission };
```

**Usage in routes:**

```javascript
const { requirePermission } = require('../middleware/permissionMiddleware');

router.post('/products', 
    authMiddleware,
    requirePermission('Products', null, 'create'),
    createProduct
);

router.put('/products/:id',
    authMiddleware,
    requirePermission('Products', null, 'update'),
    updateProduct
);

router.get('/orders/pending',
    authMiddleware,
    requirePermission('Orders', 'Pending Orders', 'view'),
    getPendingOrders
);
```

---

## API Reference

### Roles API

#### Get All Roles
```http
GET /api/admin/roles?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Role by ID
```http
GET /api/admin/roles/:role_id
Authorization: Bearer <token>
```

#### Create Role
```http
POST /api/admin/roles
Authorization: Bearer <token>

{
  "role_name": "Manager",
  "created_by": "admin@example.com"
}
```

#### Update Role
```http
PUT /api/admin/roles/:role_id
Authorization: Bearer <token>

{
  "role_name": "Senior Manager",
  "modified_by": "admin@example.com"
}
```

#### Delete Role (Soft Delete)
```http
DELETE /api/admin/roles/:role_id
Authorization: Bearer <token>
```

---

### Permissions API

#### Get All Modules
```http
GET /api/admin/permissions/modules
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Modules fetched successfully",
  "data": [
    {
      "module": "Dashboard",
      "actions": ["create", "view", "update", "delete"]
    },
    {
      "module": "Task Management",
      "submodules": [
        {
          "name": "Manage Installation",
          "actions": ["create", "view", "update", "delete"]
        }
      ]
    }
  ]
}
```

#### Assign Bulk Permissions
```http
POST /api/admin/permissions/bulk
Authorization: Bearer <token>

{
  "role_id": 2,
  "permissions": [
    {
      "module": "Dashboard",
      "submodule": null,
      "actions": ["view"],
      "status": true
    }
  ]
}
```

#### Get Permissions by Role IDs
```http
GET /api/admin/permissions/roles?ids=1,2,3
Authorization: Bearer <token>
```

#### Update Permission
```http
PUT /api/admin/permissions/:permission_id
Authorization: Bearer <token>

{
  "actions": ["view", "update"],
  "status": true
}
```

---

## Usage Examples

### Example 1: Multi-Role User

**Scenario:** User is both "Technician" and "Manager"

```javascript
// User document
{
  "user_id": "abc-123",
  "name": "John Doe",
  "roles": [2, 3],  // Technician and Manager
  "role_names": ["Technician", "Manager"]
}

// Technician permissions
{
  "role_id": 2,
  "module": "Task Management",
  "submodule": "Manage Service",
  "can_view": true,
  "can_update": true
}

// Manager permissions
{
  "role_id": 3,
  "module": "Dashboard",
  "can_view": true,
  "can_create": true
}
```

**Permission Check:**
```javascript
// User can access Dashboard (from Manager role)
await checkPermission([2, 3], "Dashboard", null, "view"); // ✅ true

// User can update service tasks (from Technician role)
await checkPermission([2, 3], "Task Management", "Manage Service", "update"); // ✅ true
```

---

### Example 2: Hierarchical Permissions

**Scenario:** Different access levels for installation vs service

```javascript
// Junior Technician - View only
{
  "role_id": 4,
  "module": "Task Management",
  "submodule": "Manage Installation",
  "can_view": true,
  "can_create": false,
  "can_update": false,
  "can_delete": false
}

// Senior Technician - Full CRUD
{
  "role_id": 5,
  "module": "Task Management",
  "submodule": "Manage Installation",
  "can_view": true,
  "can_create": true,
  "can_update": true,
  "can_delete": true
}
```

---

### Example 3: Dynamic Permission Loading

**Frontend Implementation:**

```javascript
// Login response includes user roles
{
  "token": "eyJhbGc...",
  "user": {
    "user_id": "abc-123",
    "name": "John Doe",
    "roles": [2, 3]
  }
}

// Fetch permissions for user's roles
const response = await fetch('/api/admin/permissions/roles?ids=2,3', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: permissions } = await response.json();

// Build permission map
const permissionMap = {};
permissions.forEach(p => {
  const key = `${p.module}:${p.submodule || 'main'}`;
  permissionMap[key] = {
    canCreate: p.can_create,
    canView: p.can_view,
    canUpdate: p.can_update,
    canDelete: p.can_delete
  };
});

// Use in UI
if (permissionMap['Dashboard:main']?.canView) {
  // Show dashboard link
}

if (permissionMap['Task Management:Manage Installation']?.canCreate) {
  // Show "Create Installation" button
}
```

---

## Integration Steps for New Project

### 1. Copy Core Files

```
📁 your-project/
├── config/
│   └── moduleConfig.js          ← Copy this
├── controllers/
│   ├── rolesController.js       ← Copy this
│   └── permissionsController.js ← Copy this
├── middleware/
│   ├── authMiddleware.js        ← Copy this
│   └── permissionMiddleware.js  ← Create this (see above)
├── routes/
│   ├── rolesRoutes.js           ← Copy this
│   └── permissionsRoutes.js     ← Copy this
└── scripts/
    └── seedData.js              ← Copy this
```

### 2. Update Module Configuration

Edit `config/moduleConfig.js` to match your application's features.

### 3. Set Up Database Collections

Run seed script:
```bash
node scripts/seedData.js
```

### 4. Create Roles & Permissions

Use the API endpoints to:
1. Create roles for your application
2. Assign permissions to each role
3. Create users with appropriate roles

### 5. Protect Routes

Add permission checks to your routes:

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Protected route example
router.post('/invoices', 
    authMiddleware,
    requirePermission('Invoices', null, 'create'),
    createInvoice
);
```

### 6. Update JWT Token

Ensure your login endpoint includes roles in the JWT:

```javascript
const token = jwt.sign(
    {
        user_id: user.user_id,
        email: user.email,
        roles: user.roles  // Include roles array
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

---

## Best Practices

### 1. **Caching**
- Permissions are cached with Redis (TTL: 1 hour)
- Clear cache after permission changes
- Cache key pattern: `permissions:*`

### 2. **Validation**
- Always validate role_ids exist before assigning to users
- Validate module names against moduleConfig
- Check permission status before granting access

### 3. **Audit Trail**
- Track `created_by` and `modified_by` with email addresses
- Use timestamps for all changes
- Keep soft delete records for audit purposes

### 4. **Security**
- Never expose password fields in API responses
- Use JWT with appropriate expiration
- Validate all user inputs
- Use parameterized queries to prevent injection

### 5. **Performance**
- Index `role_id` in permissions collection
- Index `user_id` and `roles` in users collection
- Use Redis caching for frequently accessed permissions
- Implement pagination for all list endpoints

---

## Database Indexes

```javascript
// Recommended indexes
db.roles.createIndex({ role_id: 1 }, { unique: true });
db.roles.createIndex({ status: 1 });

db.permissions.createIndex({ role_id: 1 });
db.permissions.createIndex({ module: 1, submodule: 1 });
db.permissions.createIndex({ role_id: 1, module: 1, submodule: 1 }, { unique: true });

db.users.createIndex({ user_id: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ roles: 1 });
db.users.createIndex({ status: 1 });
```

---

## Troubleshooting

### Issue: User has no permissions

**Solution:**
1. Check if user has roles assigned: `db.users.findOne({ user_id: 'xxx' })`
2. Verify roles exist: `db.roles.find({ role_id: { $in: [1, 2] } })`
3. Check permissions exist for roles: `db.permissions.find({ role_id: { $in: [1, 2] } })`
4. Verify permission status is `true`

### Issue: Permission check always fails

**Solution:**
1. Verify `req.roles` is populated (check authMiddleware)
2. Ensure JWT includes roles array
3. Check module and submodule names match exactly (case-sensitive)
4. Verify action is one of: `create`, `view`, `update`, `delete`

### Issue: Cache not clearing

**Solution:**
1. Check Redis connection
2. Use `clearCache('permissions:*')` after updates
3. Verify Redis client is initialized

---

## Summary

This RBAC system provides:
- ✅ **Flexible role management** with multi-role support
- ✅ **Granular permissions** at module and submodule level
- ✅ **CRUD-based actions** (create, view, update, delete)
- ✅ **Audit trail** for all changes
- ✅ **Performance optimization** with Redis caching
- ✅ **Easy integration** with existing Node.js/Express apps

**Next Steps:**
1. Customize `moduleConfig.js` for your application
2. Run `seedData.js` to create initial admin
3. Use APIs to create roles and assign permissions
4. Protect your routes with `requirePermission` middleware
5. Implement frontend permission checks

For questions or issues, refer to the API documentation and code examples above.
