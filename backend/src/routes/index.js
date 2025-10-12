const express = require('express');
const { authLimiter, searchLimiter } = require('../middleware/rateLimiter');
const authRoutes = require('./auth');
const listRoutes = require('./lists');
const commentRoutes = require('./comments');
const statisticsRoutes = require('./statistics');
const searchRoutes = require('./search');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.json({
        message: 'TopMeUp API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Auth routes
router.use('/auth', authLimiter, authRoutes);

// List routes
router.use('/lists', listRoutes);

// Comment routes
router.use('/comments', commentRoutes);

// Statistics routes
router.use('/statistics', statisticsRoutes);

router.use('/search', searchLimiter, searchRoutes);

module.exports = router;