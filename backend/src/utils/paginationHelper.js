const createPagination = (page, limit, total) => {
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
    };
};

const createFilter = (baseFilter, query) => {
    const filter = { ...baseFilter };

    if (query.category) filter.category = query.category;
    if (query.isPublic !== undefined) filter.isPublic = query.isPublic === 'true';
    if (query.userId) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(query.userId)) {
            filter.userId = query.userId;
        }
    }
    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' }},
            { description: { $regex: query.search, $options: 'i' }}
        ];
    }
    return filter;
};

const createSort = (sortBy = 'createdAt', order = 'desc') => {
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;
    return sort;
};

module.exports = {
    createPagination,
    createFilter,
    createSort
}