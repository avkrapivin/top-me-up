const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { message },
        standardHeaders: true,
        legacyHeaders: false,
        validate: { trustProxy: false, xForwardedForHeader: false },
        skip: (req) => process.env.NODE_ENV === 'development',
    });
};

// Different rate limiters for different routes
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts');
const searchLimiter = createRateLimiter(60 * 1000, 30, 'Too many search requests');
const generalLimiter = createRateLimiter(15 * 60 * 1000, 1000, 'Too many requests');

module.exports = {
    authLimiter,
    searchLimiter,
    generalLimiter,
};