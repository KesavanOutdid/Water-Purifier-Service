const { createClient } = require('redis');
const logger = require('./logger');

let redisClient;

const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        logger.error('Redis connection error:', error);
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        logger.warn('Redis client not initialized');
        return null;
    }
    return redisClient;
};

module.exports = { connectRedis, getRedisClient };
