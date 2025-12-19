const MODULES = [
    {
        module: "Dashboard",
        actions: ["create", "view", "update", "delete"]
    },
 
    // USER & ROLE MANAGEMENT
    {
        module: "Manage Users",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Roles",
        actions: ["create", "view", "update", "delete"]
    },
 
    // MODELS
    {
        module: "Manage Models",
        actions: ["create", "view", "update", "delete"]
    },
 
    // DEVICES
    {
        module: "Manage Devices",
        actions: ["create", "view", "update", "delete"]
    },
    // Part Management
    {
        module: "Manage Part",
        actions: ["create", "view", "update", "delete"]
    },
 
    // TASK MANAGEMENT (MAIN MODULE)
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
    },
 
    // SETTINGS
    {
        module: "Settings",
        actions: ["create", "view", "update", "delete"]
    }
];
 
module.exports = MODULES;