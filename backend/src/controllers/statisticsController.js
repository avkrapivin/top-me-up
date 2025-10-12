const { Statistics, List } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Get popular items
const getPopularItems = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 10 } = req.query;

        const popularItems = await Statistics.getPopularItems(category, parseInt(limit));

        return successResponse(res, popularItems);
    } catch (error) {
        console.error('Get popular items error:', error);
        return errorResponse(res, 'Failed to get popular items', 500);
    }
};

// Update statistics
const updateStatistics = async (req, res) => {
    try {
        const { category } = req.params;

        await Statistics.updateStatistics(category);

        return successResponse(res, 'Statistics updated successfully');
    } catch (error) {
        console.error('Update statistics error:', error);
        return errorResponse(res, 'Failed to update statistics', 500);
    }
};

module.exports = {
    getPopularItems,
    updateStatistics
};