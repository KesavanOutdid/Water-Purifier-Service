const MODULES = [
    {
        module: "Dashboard",
        actions: ["create", "view", "update", "delete"]
    },

    // MANAGEMENT MODULES
    {
        module: "Manage Users",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Roles",
        actions: ["create", "view", "update", "delete"]
    },

    // OTHER SEPARATE MODULES
    {
        module: "Manage Models",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Devices",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Installation",
        actions: ["create", "view", "update", "delete"]
    },
    {
        module: "Manage Service",
        actions: ["create", "view", "update", "delete"]
    },

   

    {
        module: "Settings",
        actions: ["create", "view", "update", "delete"]
    }
];

module.exports = MODULES;
