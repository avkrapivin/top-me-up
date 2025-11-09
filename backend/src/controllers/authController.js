const { User, List } = require('../models');
const { errorResponse } = require('../utils/responseHelper');

// Create or update user after authentication
const createOrUpdateuser = async (req, res) => {
    try {
        const { firebaseUid, email, displayName } = req.body;

        if (req.auth.uid !== firebaseUid) {
            return res.status(403).json({
                success: false,
                message: 'Token UID does not match request UID'
            });
        }

        if (!firebaseUid || !email || !displayName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firebaseUid, email, and displayName are required'
            });
        }

        let user = await User.findOne({ firebaseUid });

        if (user) {
            user.displayName = displayName;
            await user.save();
        } else {
            const existingEmailUser = await User.findOne({ email });

            if (existingEmailUser) {
                existingEmailUser.firebaseUid = firebaseUid;
                existingEmailUser.displayName = displayName;
                user = await existingEmailUser.save();
            } else {
                user = new User({
                    firebaseUid,
                    email,
                    displayName
                });
                await user.save();
            }
        }

        res.json({
            success: true,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Auth controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create or update user',
            error: error.message
        });
    }
};

const getAggregatedStats = async (userId) => {
    const aggregate = await List.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: '$userId',
                listsCreated: { $sum: 1 },
                totalLikes: { $sum: '$likesCount' },
                totalViews: { $sum: '$viewsCount' }
            }
        }
    ]);

    if (!aggregate.length) {
        return { listsCreated: 0, totalLikes: 0, totalViews: 0 };
    }

    const { listsCreated, totalLikes, totalViews } = aggregate[0];
    return { listsCreated, totalLikes, totalViews };
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = req.user;
        const statsFromLists = await getAggregatedStats(user._id); 

        return successResponse(res, {
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            stats: statsFromLists,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        return errorResponse(res, 'Failed to get user profile', 500);
    }
};

const updateProfile = async (req, res) => {
    try {
        const { displayName } = req.body;
        const user = req.user;

        if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
            return errorResponse(res, 'Display name is required and must be a non-empty string', 400);
        }

        if (displayName.length > 100) {
            return errorResponse(res, 'Display name must be less than 100 characters', 400);
        }

        user.displayName = displayName.trim();
        await user.save();

        const statsFromLists = await getAggregatedStats(user._id);

        return successResponse(res, {
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            stats: statsFromLists,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }, 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        return errorResponse(res, 'Failed to update profile', 500);
    }
}

module.exports = {
    createOrUpdateuser,
    getUserProfile,
    updateProfile
}