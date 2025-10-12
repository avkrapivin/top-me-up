const { RateLimitError } = require('./errors');

const retry = async (fn, maxAttempts = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            // If this is a rate limit error, wait for the specified time
            if (error instanceof RateLimitError && error.retryAfter) {
                await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
                continue;
            }

            // If it's last attempt, throw the error
            if (attempt === maxAttempts) {
                throw error;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { retry };