const { successResponse, errorResponse } = require('../utils/responseHelper');
const {
    ExternalApiError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    AuthenticationError
} = require('../utils/errors');
const searchService = require('../services/searchService');

// Get category
const getCategory = async (req, res) => {
    const { category } = req.params;;
    const { q: query, page = 1, year, genre, platform, sortBy } = req.query;

    if (!query) {
        return errorResponse(res, 'Query parameter is required', 400);
    }

    try {
        const options = {
            page: parseInt(page),
            year: year ? parseInt(year) : undefined,
            genre,
            platform,
            sortBy
        };

        const results = await searchService.search(category, query, options);
        successResponse(res, results, 'Search results retrieved successfully', 200);
    } catch (error) {
        if (error instanceof ValidationError) {
            return errorResponse(res, error.message, 400);
        }
        throw error;
    }
};

// Get details
const getDetails = async (req, res) => {
    const { category, id } = req.params;

    try {
        const details = await searchService.getDetails(category, id);
        successResponse(res, details, 'Details retrieved successfully', 200);
    } catch (error) {
        if (error instanceof ValidationError) {
            return errorResponse(res, error.message, 400);
        }
        if (error instanceof NotFoundError) {
            return errorResponse(res, error.message, 404);
        }
        throw error;
    }
};

// Get genres
const getGenres = async (req, res) => {
    const { category } = req.params;

    try {
        const genres = await searchService.getGenres(category);
        successResponse(res, {genres}, 'Genres retrieved successfully', 200);
    } catch (error) {
        if (error instanceof ValidationError) {
            return errorResponse(res, error.message, 400);
        }
        throw error;
    }
};

// Get platforms
const getPlatforms = async (req, res) => {
    try {
        const platforms = await searchService.getPlatforms('games');
        successResponse(res, { platforms }, 'Platforms retrieved successfully', 200);
    } catch (error) {
        throw error;
    }
};

// Get popular
const getPopular = async (req, res) => {
    const { category } = req.params;
    const { page = 1, year } = req.query;

    try {
        const options = {
            page: parseInt(page),
            year: year ? parseInt(year) : undefined
        };

        const results = await searchService.getPopular(category, options);
        successResponse(res, results, 'Popular results retrieved successfully', 200);
    } catch (error) {
        if (error instanceof ValidationError) {
            return errorResponse(res, error.message, 400);
        }
        throw error;
    }
}

module.exports = {
    getCategory,
    getDetails,
    getGenres,
    getPlatforms,
    getPopular
};