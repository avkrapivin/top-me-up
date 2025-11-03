const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { loadList } = require('../middleware/resourceLoader');
const { requireUser, requireOwnership } = require('../utils/userHelper');
const { validateList, validateListUpdate, validateComment } = require('../utils/validationHelper');
const asyncHandler = require('../middleware/asyncHandler');
const {
    getUserLists,
    getPublicLists,
    createList,
    getListById,
    updateList,
    deleteList,
    getListComments,
    createListComment,
    addListItem,
    updateListItem,
    removeListItem,
    reorderListItems,
    generateShareToken,
    getListByShareToken
} = require('../controllers/listController');

const router = express.Router();

// Public routes
router.get('/public', asyncHandler(getPublicLists));
router.get('/share/:token', asyncHandler(getListByShareToken));
router.get('/:id', loadList, asyncHandler(getListById));
router.get('/:id/comments', loadList, asyncHandler(getListComments));

// Private routes
router.use(verifyToken);
router.use(requireUser);

router.get('/', asyncHandler(getUserLists));
router.post('/', validateList, asyncHandler(createList));
router.put('/:id', loadList, requireOwnership(), validateListUpdate, asyncHandler(updateList));
router.delete('/:id', loadList, requireOwnership(), asyncHandler(deleteList));
router.post('/:id/comments', loadList, authLimiter, validateComment, asyncHandler(createListComment));

router.post('/:id/share', loadList, requireOwnership(), asyncHandler(generateShareToken));

router.post('/:id/items', loadList, requireOwnership(), asyncHandler(addListItem));
router.put('/:id/items/:itemId', loadList, requireOwnership(), asyncHandler(updateListItem));
router.delete('/:id/items/:itemId', loadList, requireOwnership(), asyncHandler(removeListItem));
router.put('/:id/items/reorder', loadList, requireOwnership(), asyncHandler(reorderListItems));



module.exports = router;
