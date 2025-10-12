const { User } = require('../models');

// Check if user has admin role
const requireAdmin = async (req, res, next) => {
    try {
        const uid = req.user.uid || req.user.firebaseUid;
        const user = await User.findOne({ firebaseUid: uid });

        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking admin role'
        });
    }
};

module.exports = {
    requireAdmin
}