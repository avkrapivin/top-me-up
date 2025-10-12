const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { loadComment } = require('../middleware/resourceLoader');
const { requireUser, requireOwnership } = require('../utils/userHelper');
const { validateComment } = require('../utils/validationHelper');
const asyncHandler = require('../middleware/asyncHandler');
const { 
    updateComment,
    deleteComment
} = require('../controllers/commentController');

const router = express.Router();

// Private routes
router.use(verifyToken);
router.use(requireUser);
router.use(authLimiter);

router.put('/:id', loadComment, requireOwnership('userId'), validateComment, asyncHandler(updateComment));
router.delete('/:id', loadComment, requireOwnership('userId'), asyncHandler(deleteComment));

module.exports = router;