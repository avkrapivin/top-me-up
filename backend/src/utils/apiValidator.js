const { ValidationError, ExternalApiError } = require('./errors');

const validateTMDBResponse = (data) => {
    ensureObject(data, 'TMDB');
    ensureArray(data, 'TMDB');

    if (data.status_code && data.status_code !== 1) {
        throw new ExternalApiError('TMDB', data.status_message || 'API Error', data.status_code);
    }

    return data;
};

const validateSpotifyResponse = (data) => {
    ensureObject(data, 'Spotify');

    if (data.error) {
        throw new ExternalApiError('Spotify', data.error.message || 'API Error', data.error.status || 500);
    }

    return data;
};

const validateRAWGResponse = (data) => {
    ensureObject(data, 'RAWG');
    ensureArray(data, 'RAWG');

    if (data.error) {
        throw new ExternalApiError('RAWG', data.error || 'API Error', 500);
    }

    return data;
};

const ensureObject = (data, serviceName) => {
    if (!data || typeof data !== 'object') {
        throw new ValidationError(`Invalid ${serviceName} response: not an object`);
    }
};

const ensureArray = (data, serviceName) => {
    if (data.results && !Array.isArray(data.results)) {
        throw new ValidationError(`Invalid ${serviceName} response: results is not an array`);
    }
};

module.exports = {
    validateTMDBResponse,
    validateSpotifyResponse,
    validateRAWGResponse
};