require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { verifyEmailConnection } = require('./config/email');
const seedData = require('./scripts/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        await verifyEmailConnection();
        
        await seedData();
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
