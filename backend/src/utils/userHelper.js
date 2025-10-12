const { User } = require('../models');
const { errorResponse } = require('./responseHelper');

// Get user by uid
const getUserByFirebaseUid = async (uid) => {
    return await User.findOne({ firebaseUid: uid });
}

// Middleware for getting user
const requireUser = async (req, res, next) => {
    try {
        const uid = req.auth?.uid;

        if (!uid) {
            return errorResponse(res, 'User UID not found', 404);
        }

        const user = await getUserByFirebaseUid(uid);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Require user error:', error);
        return errorResponse(res, 'Error getting user', 500);
    }
};

// Check ownership of resource
const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        try {
            const resourceUserId = req.resource?.[resourceUserIdField];
            const currentUserId = req.user?._id;

            if (!resourceUserId || !currentUserId) {
                return errorResponse(res, 'Resource or user data not found', 400);
            }

            if (resourceUserId.toString() !== currentUserId.toString()) {
                return errorResponse(res, 'Access denied', 403);
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return errorResponse(res, 'Error checking ownership', 500);
        }
    };
};

module.exports = {
    getUserByFirebaseUid,
    requireUser,
    requireOwnership
};