const MODULES = [
    {
        module: "dashboard",
        actions: ["create", "view", "update", "delete"]
    },

    {
        module: "management",
        submodules: [
            {
                name: "Manage Users",
                actions: ["create", "view", "update", "delete"]
            },
            {
                name: "Manage Roles",
                actions: ["create", "view", "update", "delete"]
            }
        ]
    },

    {
        module: "settings",
        actions: ["create", "view", "update", "delete"]
    }
];

module.exports = MODULES;
