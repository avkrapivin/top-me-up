const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { createOrUpdateuser, getUserProfile } = require('../controllers/authController');

const router = express.Router();

// Create or update user
router.post('/user', verifyToken, createOrUpdateuser);

// Get user profile
router.get('/profile', verifyToken, getUserProfile);

module.exports = router;