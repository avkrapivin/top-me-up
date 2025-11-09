const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireUser } = require('../utils/userHelper');
const { authLimiter } = require('../middleware/rateLimiter');
const { createOrUpdateuser, getUserProfile, updateProfile } = require('../controllers/authController');
const { validateProfileUpdate } = require('../utils/validationHelper');

const router = express.Router();

// Create or update user
router.post('/user', authLimiter, verifyToken, createOrUpdateuser);

// Get user profile
router.get('/profile', verifyToken, requireUser, getUserProfile);

// Update user profile
router.put('/profile', verifyToken, requireUser, validateProfileUpdate, updateProfile);

module.exports = router;