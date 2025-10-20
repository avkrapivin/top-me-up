const axios = require('axios');
const { ExternalApiError, RateLimitError, AuthenticationError } = require('../../utils/errors');
const { apiLogger } = require('../../utils/logger');
const { retry } = require('../../utils/retry');
const cacheService = require('../../utils/cache');

class BaseExternalService {
    constructor(config, serviceName) {
        this.config = config;
        this.serviceName = serviceName;
        this.baseURL = config.baseUrl;
        this.timeout = config.timeout || 10000;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TopMeUp/1.0'
            }
        });
    }

    async makeRequest(endpoint, params = {}, useCache = true) {
        const apiKeyParam = this.serviceName === 'RAWG' ? 'key' : 'api_key';
        const finalParams = { [apiKeyParam]: this.config.apiKey, ...params };

        const cacheKey = this._generateCacheKey(endpoint, finalParams);

        // Check cache
        if (useCache) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                apiLogger.response(this.serviceName, endpoint, 200, 0, 0, true);
                return cached;
            }
        }

        const startTime = Date.now();

        try {
            apiLogger.request(this.serviceName, endpoint, finalParams);

            const response = await retry(async () => {
                return await this.client.get(endpoint, { params: finalParams });
            });

            const duration = Date.now() - startTime;
            const dataSize = JSON.stringify(response.data).length;

            apiLogger.response(this.serviceName, endpoint, response.status, duration, dataSize, false);

            // Cache the response
            if (useCache && response.status === 200) {
                cacheService.set(cacheKey, response.data, 3600);
            }

            return response.data;
        } catch (error) {
            const duration = Date.now() - startTime;

            if (error.response) {
                const statusCode = error.response.status;

                // Handle rate limit
                if (statusCode === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    apiLogger.error(this.serviceName, endpoint, error, statusCode);
                    throw new RateLimitError(this.serviceName, retryAfter);
                }

                // Handle authentication errors
                if (statusCode === 401 || statusCode === 403) {
                    apiLogger.error(this.serviceName, endpoint, error, statusCode);
                    throw new AuthenticationError(this.serviceName);
                }

                // Handle other errors
                apiLogger.error(this.serviceName, endpoint, error, statusCode);
                throw new ExternalApiError(
                    this.serviceName,
                    `HTTP ${statusCode}: ${error.response.data?.message || error.message}`,
                    statusCode,
                    error
                );
            }

            apiLogger.error(this.serviceName, endpoint, error);
            throw new ExternalApiError(
                this.serviceName,
                `Network error: ${error.message}`,
                0,
                error
            );
        }
    }

    _generateCacheKey(endpoint, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});

        return `${this.serviceName}:${endpoint}:${JSON.stringify(sortedParams)}`;
    }

    // Methods for overriden by child classes
    async search(query, options = {}) {
        throw new Error('Search method must be implemented by child class');
    }

    async getDetails(id) {
        throw new Error('GetDetails method must be implemented by child class');
    }

    async getGenres() {
        throw new Error('GetGenres method must be implemented by child class');
    }
}

module.exports = BaseExternalService;