const TMDBService = require('./external/tmdbService');
const SpotifyService = require('./external/spotifyService');
const RAWGService = require('./external/rawgService');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SearchService {
    constructor() {
        this.services = {
            movies: new TMDBService(),
            music: new SpotifyService(),
            games: new RAWGService()
        };
    }

    async ensureServiceExists(category) {
        if (!this.services[category]) {
            throw new ValidationError(`Unsupported category: ${category}`);
        }
    }

    async search(category, query, options = {}) {
        this.ensureServiceExists(category);

        if (!query || query.trim().length < 2) {
            throw new ValidationError('Search request must be at least 2 characters long');
        }

        try {
            const results = await this.services[category].search(query.trim(), options);
            return {
                category,
                query: query.trim(),
                ...results
            };
        } catch (error) {
            console.error(`Search error for ${category}:`, error.message);
            throw error;
        }
    }

    async getDetails(category, id) {
        this.ensureServiceExists(category);

        if (!id || id.trim().length < 1) {
            throw new ValidationError('ID is required');
        }

        try {
            const details = await this.services[category].getDetails(id);
            if (!details) {
                throw new NotFoundError(category, id);
            }
            return details;
        } catch (error) {
            console.error(`Get details error for ${category}:`, error.message);
            throw error;
        }
    }

    async getGenres(category) {
        this.ensureServiceExists(category);

        try {
            return await this.services[category].getGenres();
        } catch (error) {
            console.error(`Get genres error for ${category}:`, error.message);
            throw error;
        }
    }

    async getPlatforms(category) {
        this.ensureServiceExists(category);

        if (category === 'games') {
            try {
                return await this.services.games.getPlatforms();
            } catch (error) {
                console.error(`Get platforms error for ${category}:`, error.message);
                throw error;
            }
        }
        throw new ValidationError(`Platforms not supported for category: ${category}`);
    }

    async getPopular(category, options = {}) {
        this.ensureServiceExists(category);

        try {
            return await this.services[category].getPopular(options);
        } catch (error) {
            console.error(`Get popular error for ${category}:`, error.message);
            throw error;
        }
    }
}

module.exports = new SearchService();