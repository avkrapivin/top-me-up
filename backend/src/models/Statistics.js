const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['movies', 'music', 'games'],
        required: true,
        index: true
    },
    popularItems: [{
        externalId: String,
        title: String,
        count: Number,
        posterUrl: String
    }],
    totalLists: {
        type: Number,
        default: 0
    }, 
    totalItems: {
        type: Number,
        default: 0
    },
    totalLikes: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for faster queries
statisticsSchema.index({ category: 1, date: -1 });

// Methods
statisticsSchema.statics.getPopularItems = async function(category, limit = 10) {
    const today = new Date();
    const startOfDay = new Date (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    let stats = await this.findOne({
        date: { $gte: startOfDay },
        category: category
    });

    if (!stats) {
        // Create new statistics for today
        stats = await this.create({
            date: startOfDay,
            category: category,
            popularItems: [],
            totalLists: 0,
            totalItems: 0,
            totalLikes: 0,
            totalViews: 0
        });
    }

    return stats.popularItems.slice(0, limit);
};

statisticsSchema.statics.updateStatistics = async function(category) {
    const today = new Date();
    const startOfDay = new Date (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // Update totalLists
    const List = mongoose.model('List');
    
    const pipeline = [
        { $match: { category: category, isPublic: true } },
        { $unwind: '$items' },
        {
            $group: {
                _id: { externalId: '$items.externalId', title: '$items.title' },
                count: { $sum: 1 },
                posterUrl: { $first: '$items.posterUrl' }
            }
        },
        { $sort: { count: - 1 } },
        { $limit: 20 },
        {
            $project: {
                externalId: '$_id.externalId',
                title: '$_id.title',
                count: '$count',
                posterUrl: '$posterUrl'
            }
        }
    ];

    // Update popular items
    const popularItems = await List.aggregate(pipeline);

    const totalStats = await List.aggregate([
        { $match: { category: category, isPublic: true } },
        {
            $group: {
                _id: null,
                totalLists: { $sum: 1 },
                totalItems: { $sum: { $size: '$items' }},
                totalLikes: { $sum: '$likesCount' },
                totalViews: { $sum: '$viewsCount' }
            }
        }
    ]);

    const stats = totalStats[0] || { totalLists: 0, totalItems: 0, totalLikes: 0, totalViews: 0 };

    // Update statistics
    await this.findOneAndUpdate(
        { date: startOfDay, category: category },
        {
            popularItems,
            totalLists: stats.totalLists,
            totalItems: stats.totalItems,
            totalLikes: stats.totalLikes,
            totalViews: stats.totalViews
        },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Statistics', statisticsSchema);