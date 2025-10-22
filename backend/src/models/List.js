const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema({
    externalId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    position: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    category: {
        type: String,
        enum: ['movies', 'music', 'games'],
        required: true
    },
    // Cached data from external API
    cachedData: {
        posterUrl: String,
        year: Number,
        artist: String,
        genres: [String],
        rating: Number,
        description: String
    }
}, { _id: false });

const listSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['movies', 'music', 'games'],
        required: true,
        index: true
    },
    items: [listItemSchema],
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    viewsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    description: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals fields
listSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

listSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'listId'
});

// Indexes for faster queries
listSchema.index({ userId: 1, createdAt: -1 });
listSchema.index({ isPublic: 1, category: 1, createdAt: -1 });
listSchema.index({ likesCount: -1 });
listSchema.index({ viewsCount: -1 });

// Middleware for auto-incrementing position
listSchema.pre('save', function(next) {
    this.likesCount = this.likes.length;
    next();
});

// Methods
listSchema.methods.incrementViews = function() {
    this.viewsCount += 1;
    return this.save();
};

listSchema.methods.addLike = function(userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId);
    }
    return this.save();
};

listSchema.methods.removeLike = function(userId) {
    this.likes = this.likes.filter(id => !id.equals(userId));
    return this.save();
};

listSchema.methods.generateShareToken = function() {
    const crypto = require('crypto');
    this.shareToken = crypto.randomBytes(16).toString('hex');
    return this.save();
};

module.exports = mongoose.model('List', listSchema);

