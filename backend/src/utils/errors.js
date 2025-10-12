class ExternalApiError extends Error {
    constructor(service, message, statusCode = 500, originalError = null) {
        super(message);
        this.name = 'ExternalApiError';
        this.service = service;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends Error {
    constructor(message, fields = null) {
        super(message);
        this.name = 'ValidationError';
        this.fields = fields;
        this.statusCode = 400;
        this.timestamp = new Date().toISOString();
    }
}

class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} with ID ${id} not found`);
        this.name = 'NotFoundError';
        this.resource = resource;
        this.id = id;
        this.statusCode = 404;
        this.timestamp = new Date().toISOString();
    }
}

class RateLimitError extends Error {
    constructor(service, retryAfter = null) {
        super(`Rate limit exceeded for ${service}`);
        this.name = 'RateLimitError';
        this.service = service;
        this.retryAfter = retryAfter;
        this.statusCode = 429;
        this.timestamp = new Date().toISOString();
    }
}

class AuthenticationError extends Error {
    constructor(service, message = 'Authentication failed') {
        super(`${service}: ${message}`);
        this.name = 'AuthenticationError';
        this.service = service;
        this.statusCode = 401;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = {
    ExternalApiError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    AuthenticationError
};