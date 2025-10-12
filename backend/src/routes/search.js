const express = require('express');
const { searchLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../middleware/asyncHandler');
const { 
    getCategory, 
    getDetails, 
    getGenres, 
    getPlatforms, 
    getPopular 
} = require('../controllers/searchController');

const router = express.Router();

router.get('/:category', searchLimiter, asyncHandler(getCategory));
router.get('/:category/details/:id', searchLimiter, asyncHandler(getDetails));
router.get('/:category/genres', searchLimiter, asyncHandler(getGenres));
router.get('/:category/platforms', searchLimiter, asyncHandler(getPlatforms));
router.get('/:category/popular', searchLimiter, asyncHandler(getPopular));

module.exports = router;