const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
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
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals fields
commentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

commentSchema.virtual('list', {
    ref: 'List',
    localField: 'listId',
    foreignField: '_id',
    justOne: true
});

commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentCommentId'
});

// Indexes for faster queries
commentSchema.index({ listId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ isDeleted: 1 });

// Middleware
commentSchema.pre('save', function(next) {
    this.likesCount = this.likes.length;
    if (this.isModified('content') && !this.isNew) {
        this.isUpdated = true;
        this.editedAt = new Date();
    }
    next();
});

// Methods
commentSchema.methods.addLike = function(userId) {
    if (!this.likes.includes(userId)) {
        this.likes.push(userId);
    }
    return this.save();
};

commentSchema.methods.removeLike = function(userId) {
    this.likes = this.likes.filter(id => !id.equals(userId));
    return this.save();
};

commentSchema.methods.softDelete = function() {
    this.isDeleted = true;
    this.content = 'This comment has been deleted';
    return this.save();
};

module.exports = mongoose.model('Comment', commentSchema);