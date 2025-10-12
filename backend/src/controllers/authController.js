const { User } = require('../models');

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
            // Update user
            user.email = email;
            user.displayName = displayName;
            await user.save();
        } else {
            // Create user
            user = new User({
                firebaseUid,
                email,
                displayName
            });
            await user.save();
        }

        res.json({
            success: true,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Auth cuntroller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create or update user',
            error: error.message
        });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile',
            error: error.message
        });
    }
};

module.exports = {
    createOrUpdateuser,
    getUserProfile
}