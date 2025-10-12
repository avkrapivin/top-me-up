const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const asyncHandler = require('../middleware/asyncHandler');
const { getPopularItems, updateStatistics } = require('../controllers/statisticsController');

const router = express.Router();

// Public routes
router.get('/popular/:category', asyncHandler(getPopularItems));

// Admin routes
router.post('/update/:category', verifyToken, requireAdmin, asyncHandler(updateStatistics));

module.exports = router;