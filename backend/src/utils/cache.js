const NodeCache = require('node-cache');

// Create a new cache with default TTL of 1 hour
const cache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 600, // Check every 10 minutes
    useClones: false
});

const cacheService = {
    get: (key) => {
        try {
            return cache.get(key);
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    set: (key, value, ttl = 3600) => {
        try {
            return cache.set(key, value, ttl);
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    del: (key) => {
        try {
            return cache.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    flush: () => {
        try {
            return cache.flushAll();
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    },

    getStats: () => {
        return cache.getStats();
    }
};

module.exports = cacheService;