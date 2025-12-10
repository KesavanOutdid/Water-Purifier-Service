const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Redis connection error:', error);
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        console.warn('Redis client not initialized');
        return null;
    }
    return redisClient;
};

module.exports = { connectRedis, getRedisClient };
