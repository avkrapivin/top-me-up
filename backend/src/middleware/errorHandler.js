const { logger } = require('../utils/logger');
const { 
    ExternalApiError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    AuthenticationError
} = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Log the error
    logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    if (err.name === 'CastError') {
        error = new NotFoundError('Resource', err.value);
    } else if (err.code === 11000) {
        error = new ValidationError(message);
    } else if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ValidationError(message);
    }

    if (error instanceof ValidationError) {
        return res.status(400).json({
            success: false,
            message: error.message,
            fields: error.fields,
            timestamp: error.timestamp
        });
    }

    if (error instanceof NotFoundError) {
        return res.status(404).json({
            success: false,
            message: error.message,
            resource: error.resource,
            id: error.id,
            timestamp: error.timestamp
        });
    }

    if (error instanceof RateLimitError) {
        return res.status(429).json({
            success: false,
            message: error.message,
            service: error.service,
            retryAfter: error.retryAfter,
            timestamp: error.timestamp
        });
    }

    if (error instanceof AuthenticationError) {
        return res.status(401).json({
            success: false,
            message: error.message,
            service: error.service,
            timestamp: error.timestamp
        });
    }

    // Default error
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = errorHandler;