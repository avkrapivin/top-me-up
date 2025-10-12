const { Comment, List, User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { createPagination } = require('../utils/paginationHelper');

// Get comments for a list
const getListComments = async (req, res) => {
    const { listId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
        listId,
        isDeleted: false,
        parentCommentId: null
    })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName')
        .populate('replies');

    const total = await Comment.countDocuments({
        listId,
        isDeleted: false,
        parentCommentId: null
    });

    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, comments, pagination);
};

// Create a new comment
const createComment = async (req, res) => {
    const { listId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    const list = await List.findById(listId);
    if (!list) {
        return errorResponse(res, 'List not found', 404);
    }

    const comment = new Comment({
        listId,
        userId,
        content,
        parentCommentId: parentCommentId || null
    });

    await comment.save();

    // Update list's comment count
    await List.findByIdAndUpdate(listId, {
        $inc: { commentsCount: 1 }
    });

    return successResponse(res, comment, 'Comment created successfully', 201);
};

// Update a comment
const updateComment = async (req, res) => {
    const { content } = req.body;
    const comment = req.resource;

    comment.content = content;
    await comment.save();

    return successResponse(res, comment, 'Comment updated successfully');
}

// Delete a comment
const deleteComment = async (req, res) => {
    const comment = req.resource;

    await comment.softDelete();

    await List.findByIdAndUpdate(comment.listId, {
        $inc: { commentsCount: -1 }
    });

    return successResponse(res, comment, 'Comment deleted successfully');
}

module.exports = {
    getListComments,
    createComment,
    updateComment,
    deleteComment
};