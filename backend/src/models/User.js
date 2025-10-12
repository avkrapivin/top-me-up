const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    stats: {
        listsCreated: {
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
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals fields
userSchema.virtual('lists', {
    ref: 'List',
    localField: '_id',
    foreignField: 'userId'
});

// Indexes for faster queries
userSchema.index({ isActive: 1, createdAt: -1 });
userSchema.index({ 'stats.totalLikes': -1 });
userSchema.index({ 'stats.totalViews': -1 });

// Methods
userSchema.methods.toPublicJSON = function() {
    return {
        _id: this._id,
        displayName: this.displayName,
        stats: this.stats,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);