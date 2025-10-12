const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Spicial logger for external API calls
const apiLogger = {
    request: (service, endpoint, params = {}) => {
        logger.info('External API Request', {
            service,
            endpoint,
            params: JSON.stringify(params),
            timestamp: new Date().toISOString()
        });
    },

    response: (service, endpoint, statusCode, duration, dataSize = null, fromCache = false) => {
        logger.info('External API Response', {
            service,
            endpoint,
            statusCode,
            duration: `${duration}ms`,
            dataSize: dataSize ? `${dataSize} bytes`: null,
            fromCache, 
            timestamp: new Date().toISOString()
        });
    },

    error: (service, endpoint, error, statusCode = null) => {
        logger.error('External API Error', {
            service,
            endpoint,
            error: error.message,
            statusCode,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    logger,
    apiLogger
}