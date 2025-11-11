const express = require('express');
const { verifyToken, optionalVerifyToken } = require('../middleware/auth');
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
    getListByShareToken,
    getShareToken,
    resetShareToken,
    renderSharePreview,
    generateListPreview,
    likeList,
    unlikeList
} = require('../controllers/listController');

const router = express.Router();

// Public routes
router.get('/public', asyncHandler(getPublicLists));
router.get('/preview/:token', asyncHandler(generateListPreview));
router.get('/s/:token', asyncHandler(renderSharePreview));
router.get('/share/:token', asyncHandler(renderSharePreview));
router.get('/share/:token/data', asyncHandler(getListByShareToken));
router.get('/:id', optionalVerifyToken, loadList, asyncHandler(getListById));
router.get('/:id/comments', optionalVerifyToken,loadList, asyncHandler(getListComments));

// Private routes
router.use(verifyToken);
router.use(requireUser);

router.get('/', asyncHandler(getUserLists));
router.post('/', validateList, asyncHandler(createList));
router.post('/:id/like', loadList, asyncHandler(likeList));
router.delete('/:id/like', loadList, asyncHandler(unlikeList));
router.put('/:id', loadList, requireOwnership(), validateListUpdate, asyncHandler(updateList));
router.delete('/:id', loadList, requireOwnership(), asyncHandler(deleteList));
router.post('/:id/comments', loadList, authLimiter, validateComment, asyncHandler(createListComment));

router.get('/:id/share', loadList, requireOwnership(), asyncHandler(getShareToken));
router.post('/:id/share', loadList, requireOwnership(), asyncHandler(generateShareToken));
router.delete('/:id/share', loadList, requireOwnership(), asyncHandler(resetShareToken));

router.post('/:id/items', loadList, requireOwnership(), asyncHandler(addListItem));
router.put('/:id/items/:itemId', loadList, requireOwnership(), asyncHandler(updateListItem));
router.delete('/:id/items/:itemId', loadList, requireOwnership(), asyncHandler(removeListItem));
router.put('/:id/items/reorder', loadList, requireOwnership(), asyncHandler(reorderListItems));



module.exports = router;
