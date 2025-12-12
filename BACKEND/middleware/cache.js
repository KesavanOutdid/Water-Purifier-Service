const { getRedisClient } = require('../config/redis');

const cacheMiddleware = (keyPrefix, ttl = 300) => {
    return async (req, res, next) => {
        const redisClient = getRedisClient();
        
        if (!redisClient) {
            return next();
        }

        try {
            const { page = 1, limit = 10 } = req.query;
            const queryParams = new URLSearchParams(req.query).toString();
            const cacheKey = `${keyPrefix}:${queryParams || `page=${page}&limit=${limit}`}`;

            const cachedData = await redisClient.get(cacheKey);

            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }

            const originalJson = res.json.bind(res);
            res.json = (data) => {
                if (data.success) {
                    redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch(err => {
                        console.error('Redis cache set error:', err);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

const clearCache = async (keyPattern) => {
    const redisClient = getRedisClient();
    
    if (!redisClient) {
        return;
    }

    try {
        const keys = await redisClient.keys(keyPattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.error('Clear cache error:', error);
    }
};

module.exports = { cacheMiddleware, clearCache };
