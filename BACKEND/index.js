require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { verifyEmailConnection } = require('./config/email');
const seedData = require('./scripts/seedData');
const createIndexes = require('./scripts/createIndexes');
const { startTaskMonitor } = require('./jobs/taskMonitor');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        await verifyEmailConnection();
        
        await seedData();
        await createIndexes();
        
        startTaskMonitor();
        
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
