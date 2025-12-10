const MODULES = [
    {
        module: 'dashboard',
        actions: ['create', 'view', 'update', 'delete']
    },
   
    {
        module: 'user_management',
        submodules: [
            { name: 'manage_roles', actions: ['create', 'view', 'update', 'delete'] },
            { name: 'manage_users', actions: ['create', 'view', 'update', 'delete'] }
        ]
    },
    
    {
        module: 'profile',
        actions: ['create', 'view', 'update', 'delete']
    }
];

module.exports = MODULES;
