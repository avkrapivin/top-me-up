const { List, Comment } = require('../models');
const { errorResponse } = require('../utils/responseHelper');

// Load list by id
const loadList = async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return errorResponse(res, 'Invalid list ID format', 400);
        }

        const { id } = req.params;
        const list = await List.findById(id);

        if (!list) {
            return errorResponse(res, 'List not found', 404);
        }

        req.resource = list;
        next();
    } catch (error) {
        console.error('Load list error:', error);
        return errorResponse(res, 'Error loading list', 500);
    }
};

// Load comment by id
const loadComment = async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return errorResponse(res, 'Invalid comment ID format', 400);
        }

        const { id } = req.params;
        const comment = await Comment.findById(id);

        if (!comment) {
            return errorResponse(res, 'Comment not found', 404);
        }

        req.resource = comment;
        next();
    } catch (error) {
        console.error('Load comment error:', error);
        return errorResponse(res, 'Error loading comment', 500);
    }
};

module.exports = {
    loadList,
    loadComment
};