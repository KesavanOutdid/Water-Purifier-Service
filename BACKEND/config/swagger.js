const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const os = require('os');

const getNetworkIPs = () => {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
};

const port = process.env.HTTP_PORT || 5000;
const networkIPs = getNetworkIPs();

const servers = [
    {
        url: `http://localhost:${port}`,
        description: 'Local server',
    },
    ...networkIPs.map(ip => ({
        url: `http://${ip}:${port}`,
        description: `Network server (${ip})`,
    })),
    {
        url: 'https://api.waterpurifier.com',
        description: 'Production server',
    },
];

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Water Purifier Service API Documentation',
            version: '1.0.0',
            description: 'API for Water Purifier Service Management System',
            contact: {
                name: 'API Support',
                email: 'support@waterpurifier.com',
            },
        },
        servers,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                            description: 'Success status',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                            description: 'Success status',
                        },
                        message: {
                            type: 'string',
                            description: 'Success message',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        currentPage: {
                            type: 'integer',
                            description: 'Current page number',
                        },
                        pageSize: {
                            type: 'integer',
                            description: 'Number of items per page',
                        },
                        totalItems: {
                            type: 'integer',
                            description: 'Total number of items',
                        },
                        totalPages: {
                            type: 'integer',
                            description: 'Total number of pages',
                        },
                        hasNextPage: {
                            type: 'boolean',
                            description: 'Whether there is a next page',
                        },
                        hasPrevPage: {
                            type: 'boolean',
                            description: 'Whether there is a previous page',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/**/*.js', './controllers/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Water Purifier API Docs',
    }));
};

module.exports = { setupSwagger, swaggerSpec };
