const { List, User, Comment } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { createPagination, createFilter, createSort } = require('../utils/paginationHelper');

// Get lists of user
const getUserLists = async (req, res) => {
    const { page = 1, limit = 10, category, isPublic } = req.query;
    const userId = req.user._id;

    const filter = createFilter({ userId }, { category, isPublic });
    const sort = createSort('createdAt', 'desc');

    const lists = await List.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName');

    const total = await List.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, lists, pagination);
};

// Get public lists
const getPublicLists = async (req, res) => {
    const { page = 1, limit = 10, category, sortBy = 'createdAt' } = req.query;

    const filter = createFilter({ isPublic: true }, { category });
    const sort = createSort(sortBy, 'desc');

    const lists = await List.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName');

    const total = await List.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, lists, pagination);
};

// Create new list
const createList = async (req, res) => {
    const { title, category, description, isPublic = false, items = [] } = req.body;
    const userId = req.user._id;

    const list = new List({
        userId,
        title,
        category,
        description,
        isPublic,
        items
    });

    await list.save();

    // Update user's statistics
    await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.listsCreated': 1 }
    });

    return successResponse(res, list, 'List created successfully', 201);
};

// Get list by ID
const getListById = async (req, res) => {
    const list = req.resource;

    // Check if list is public or owned by the user
    const uid = req.auth?.uid;
    if (!list.isPublic) {
        if (!uid) return errorResponse(res, 'Authentication required', 401);
        const user = await User.findOne({ firebaseUid: uid });
        if (!user || list.userId.toString() !== user._id.toString()) {
            return errorResponse(res, 'Not authorized', 403);
        }
    }

    await list.populate('user', 'displayName');

    // Increment views count
    await list.incrementViews();

    return successResponse(res, list);
};

// Update list
const updateList = async (req, res) => {
    const { title, description, isPublic, items } = req.body;
    const list = req.resource;

    if (items && items.length > 10) {
        return errorResponse(res, 'List cannot have more than 10 items', 400);
    }

    if (title) list.title = title;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;
    if (items !== undefined) list.items = items;

    await list.save();

    return successResponse(res, list, 'List updated successfully');
};

// Delete list
const deleteList = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    await List.findByIdAndDelete(list._id);

    // Update user's statistics
    await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.listsCreated': -1 }
    });

    return successResponse(res, null, 'List deleted successfully');
};

// Get comments for a list
const getListComments = async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
        listId: id,
        isDeleted: false,
        parentCommentId: null
    })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName')
        .populate('replies');

    const total = await Comment.countDocuments({
        listId: id,
        isDeleted: false,
        parentCommentId: null
    });

    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, comments, pagination);
};

// Create a new comment for a list
const createListComment = async (req, res) => {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    const list = req.resource;

    const comment = new Comment({
        listId: id,
        userId,
        content,
        parentCommentId: parentCommentId || null
    });

    await comment.save();

    await List.findByIdAndUpdate(id, {
        $inc: { commentsCount: 1 }
    });

    return successResponse(res, comment, 'Comment created successfully', 201);
}

// Add item to list
const addListItem = async (req, res) => {
    const { externalId, title, category, position, cachedData } = req.body;
    const list = req.resource;

    const existingItem = list.items.find(item => item.externalId === externalId);
    if (existingItem) {
        return errorResponse(res, 'Item already exists in the list', 400);
    }

    if (position < 1 || position > 10) {
        return errorResponse(res, 'Position must be between 1 and 10', 400);
    }

    if (list.items.length >= 10) {
        return errorResponse(res, 'List is full (max 10 items)', 400);
    }

    if (category !== list.category) {
        return errorResponse(res, 'Item category must match list category', 400);
    }

    list.items.forEach(item => {
        if (item.position >= position) item.position += 1;
    });

    list.items.push({
        externalId,
        title,
        category,
        position,
        cachedData: cachedData || {}
    });

    list.items.sort((a, b) => a.position - b.position);

    await list.save();

    return successResponse(res, list, 'Item added successfully', 201);
};

// Update item in list
const updateListItem = async (req, res) => {
    const { itemId } = req.params;
    const { position, cachedData } = req.body;
    const list = req.resource;

    const itemIndex = list.items.findIndex(item => item.externalId === itemId);
    if (itemIndex === -1) {
        return errorResponse(res, 'Item not found in the list', 404);
    }

    if (position !== undefined) {
        if (position < 1 || position > 10) {
            return errorResponse(res, 'Position must be between 1 and 10', 400);
        }
        list.items[itemIndex].position = position;
    }

    if (cachedData) {
        list.items[itemIndex].cachedData = {
            ...list.items[itemIndex].cachedData,
            ...cachedData
        };
    }

    list.items.sort((a, b) => a.position - b.position);
    await list.save();
    return successResponse(res, list, 'Item updated successfully', 200);
}

// Remove item from list
const removeListItem = async (req, res) => {
    const { itemId } = req.params;
    const list = req.resource;

    const itemIndex = list.items.findIndex(item => item.externalId === itemId);
    if (itemIndex === -1) {
        return errorResponse(res, 'Item not found in the list', 404);
    }

    const newItems = list.items.filter(item => item.externalId !== itemId);
    newItems.forEach((item, index) => {
        item.position = index + 1;
    });
    list.items = newItems;

    await list.save();
    return successResponse(res, list, 'Item removed successfully', 200);
}

// Reorder items in list
const reorderListItems = async (req, res) => {
    const { items } = req.body; // Array of { externalId, position }
    const list = req.resource;

    if (!Array.isArray(items)) {
        return errorResponse(res, 'Items must be an array', 400);
    }

    items.forEach(({ externalId, position }) => {
        const item = list.items.find(item => item.externalId === externalId);
        if (item) {
            item.position = position;
        }
    });

    list.items.sort((a, b) => a.position - b.position);
    await list.save();
    return successResponse(res, list, 'Items reordered successfully', 200);
}

// Generate share token for a list
const generateShareToken = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (list.userId.toString() !== userId.toString()) {
        return errorResponse(res, 'Not authorized', 403);
    }

    await list.generateShareToken();

    return successResponse(res, { 
        shareToken: list.shareToken,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${list.shareToken}`
    }, 'Share token generated successfully'); 
};

// Get list by share token (public access)
const getListByShareToken = async (req, res) => {
    const { token } = req.params;

    const list = await List.findOne({ shareToken: token, isPublic: true });

    if (!list) {
        return errorResponse(res, 'List not found or not public', 404);
    }

    await list.populate('user', 'displayName');
    await list.incrementViews();
    
    return successResponse(res, list);
}

module.exports = {
    getUserLists,
    getPublicLists,
    createList,
    getListById,
    updateList,
    deleteList,
    getListComments,
    createListComment,
    addListItem,
    updateListItem,
    removeListItem,
    reorderListItems,
    generateShareToken,
    getListByShareToken
};