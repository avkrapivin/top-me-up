const { List, User, Comment } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { createPagination, createFilter, createSort } = require('../utils/paginationHelper');
const mongoose = require('mongoose');

// Get lists of user
const getUserLists = async (req, res) => {
    const { page = 1, limit = 10, category, isPublic } = req.query;
    const userId = req.user._id;

    const filter = createFilter({ userId }, { category, isPublic });
    const sort = createSort('createdAt', 'desc');

    const lists = await List.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName');

    const total = await List.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, lists, pagination);
};

// Get public lists
const getPublicLists = async (req, res) => {
    const { page = 1, limit = 10, category, sortBy = 'createdAt', userId } = req.query;

    const uid = req.auth?.uid;
    const currentUser = uid
        ? await User.findOne({ firebaseUid: uid }).select('_id').lean()
        : null;
    const currentUserId = currentUser?._id?.toString() ?? null;

    const filter = createFilter({ isPublic: true }, { category, userId });
    const sort = createSort(sortBy, 'desc');

    const lists = await List.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName')
        .lean();

    const listsWithLikes = lists.map(list => {
        const listObj = list.toObject ? list.toObject() : list;
        listObj.userHasLiked = currentUserId
            ? list.likes.some((id) => {
                const likeId = id?.toString ? id.toString() : String(id);
                return likeId === currentUserId;
            })
            : false;
        return listObj;
    });

    const total = await List.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, listsWithLikes, pagination);
};

// Create new list
const createList = async (req, res) => {
    const { title, category, description, isPublic = false, items = [] } = req.body;
    const userId = req.user._id;

    const list = new List({
        userId,
        title,
        category,
        description,
        isPublic,
        items
    });

    if (isPublic && !list.shareToken) {
        await list.generateShareToken();
    } else {
        await list.save();
    }

    // Update user's statistics
    await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.listsCreated': 1 }
    });

    return successResponse(res, list, 'List created successfully', 201);
};

// Get list by ID
const getListById = async (req, res) => {
    const list = req.resource;
    const uid = req.auth?.uid;

    const currentUser = uid
        ? await User.findOne({ firebaseUid: uid }).select('_id').lean()
        : null;

    // Check if list is public or owned by the user
    if (!list.isPublic) {
        if (!currentUser) {
            return errorResponse(res, 'Authentication required', 401);
        }
        if (list.userId.toString() !== currentUser._id.toString()) {
            return errorResponse(res, 'Not authorized', 403);
        }
    }

    const isOwner = currentUser && list.userId.toString() === currentUser._id.toString();

    // Increment views count
    if (!isOwner) {
        await list.incrementViews();
    }

    const owner = await User.findById(list.userId)
        .select('_id displayName')
        .lean();

    const payload = list.toObject({ virtuals: true });
    payload.user = owner
        ? { _id: owner._id.toString(), displayName: owner.displayName }
        : null;

    payload.userHasLiked = currentUser
        ? list.likes.some((id) => id.equals(currentUser._id))
        : false;

    return successResponse(res, payload);
};

// Update list
const updateList = async (req, res) => {
    const { title, description, isPublic, items } = req.body;
    const list = req.resource;

    if (items && items.length > 10) {
        return errorResponse(res, 'List cannot have more than 10 items', 400);
    }

    const wasPublic = list.isPublic;
    const becomesPublic = isPublic !== undefined ? isPublic : wasPublic;

    if (title) list.title = title;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;
    if (items !== undefined) list.items = items;

    if (becomesPublic && !wasPublic && !list.shareToken) {
        await list.generateShareToken();
    } else {
        await list.save();
    }

    return successResponse(res, list, 'List updated successfully');
};

// Delete list
const deleteList = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    await List.findByIdAndDelete(list._id);

    // Update user's statistics
    await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.listsCreated': -1 }
    });

    return successResponse(res, null, 'List deleted successfully');
};

// Get comments for a list
const getListComments = async (req, res) => {
    const { limit = 20, cursor } = req.query;
    const list = req.resource;
    const limitValue = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    let currentUserId = null;
    if (req.auth?.uid) {
        const currentUser = await User.findOne({ firebaseUid: req.auth.uid })
            .select('_id')
            .lean();
        currentUserId = currentUser?._id?.toString() ?? null;
    }

    const baseFilter = {
        listId: list._id,
        isDeleted: false,
        parentCommentId: null
    };

    if (cursor) {
        if (!mongoose.Types.ObjectId.isValid(cursor)) {
            return errorResponse(res, 'Invalid cursor', 400);
        }
        baseFilter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const rawComments = await Comment.find(baseFilter)
        .sort({ _id: -1 })
        .limit(limitValue + 1)
        .lean();

    const hasNext = rawComments.length > limitValue;
    const parentComments = hasNext ? rawComments.slice(0, limitValue) : rawComments;
    const nextCursor = hasNext
        ? parentComments[parentComments.length - 1]._id.toString()
        : null;

    const loadAllReplies = async (parentIds) => {
        if (!parentIds || parentIds.length === 0) return [];

        const directReplies = await Comment.find({
            parentCommentId: { $in: parentIds }
        })
            .sort({ _id: 1 })
            .lean();

        if (directReplies.length === 0) return [];

        const replyIds = directReplies.map(reply => reply._id);
        const nestedReplies = await loadAllReplies(replyIds);

        return [...directReplies, ...nestedReplies];
    };

    const parentIds = parentComments.map((comment) => comment._id);
    const allReplies = await loadAllReplies(parentIds);

    const allParentIds = new Set();
    allReplies.forEach(reply => {
        if (reply.parentCommentId) {
            allParentIds.add(reply.parentCommentId.toString());
        }
    });
    parentComments.forEach(comment => {
        allParentIds.add(comment._id.toString());
    });

    const userIds = new Set();
    const normalize = (doc) => {
        doc._id = doc._id.toString();
        doc.listId = doc.listId?.toString();
        doc.userId = doc.userId?.toString();
        doc.parentCommentId = doc.parentCommentId?.toString();
        doc.likes = (doc.likes || []).map((id) => id.toString());
        if (doc.userId) userIds.add(doc.userId);
        return doc;
    };

    parentComments.forEach(normalize);
    allReplies.forEach(normalize);

    let usersMap = new Map();
    if (userIds.size) {
        const users = await User.find({ _id: { $in: Array.from(userIds) } })
            .select('_id displayName')
            .lean();
        usersMap = new Map(
            users.map((user) => [
                user._id.toString(),
                { _id: user._id.toString(), displayName: user.displayName }
            ])
        );
    }

    const userLikes = (likes) =>
        currentUserId ? likes.some((id) => id === currentUserId) : false;

    const buildRepliesTree = (parentId) => {
        return allReplies
            .filter(reply => {
                const replyParentId = reply.parentCommentId?.toString();
                const parentIdStr = parentId?.toString ? parentId.toString() : String(parentId);
                return replyParentId === parentIdStr;
            })
            .map(reply => {
                const { likes, ...rest } = reply;
                return {
                    ...rest,
                    user: usersMap.get(reply.userId) || null,
                    userHasLiked: userLikes(likes),
                    likesCount: likes.length,
                    replies: buildRepliesTree(reply._id)
                };
            });
    };

    const responseData = parentComments.map((comment) => {
        const { likes, ...rest } = comment;
        return {
            ...rest,
            user: usersMap.get(comment.userId) || null,
            userHasLiked: userLikes(likes),
            likesCount: likes.length,
            replies: buildRepliesTree(comment._id)
        };
    });

    const total = await Comment.countDocuments({
        listId: list._id,
        isDeleted: false
    });

    const pagination = {
        limit: limitValue,
        total,
        hasNext,
        nextCursor
    };

    return paginatedResponse(res, responseData, pagination);
};

// Create a new comment for a list
const createListComment = async (req, res) => {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    const list = req.resource;

    const comment = new Comment({
        listId: id,
        userId,
        content,
        parentCommentId: parentCommentId || null
    });

    await comment.save();

    await List.findByIdAndUpdate(id, {
        $inc: { commentsCount: 1 }
    });

    return successResponse(res, comment, 'Comment created successfully', 201);
}

// Add item to list
const addListItem = async (req, res) => {
    const { externalId, title, category, position, cachedData } = req.body;
    const list = req.resource;

    const existingItem = list.items.find(item => item.externalId === externalId);
    if (existingItem) {
        return errorResponse(res, 'Item already exists in the list', 400);
    }

    if (position < 1 || position > 10) {
        return errorResponse(res, 'Position must be between 1 and 10', 400);
    }

    if (list.items.length >= 10) {
        return errorResponse(res, 'List is full (max 10 items)', 400);
    }

    if (category !== list.category) {
        return errorResponse(res, 'Item category must match list category', 400);
    }

    list.items.forEach(item => {
        if (item.position >= position) item.position += 1;
    });

    list.items.push({
        externalId,
        title,
        category,
        position,
        cachedData: cachedData || {}
    });

    list.items.sort((a, b) => a.position - b.position);

    await list.save();

    return successResponse(res, list, 'Item added successfully', 201);
};

// Update item in list
const updateListItem = async (req, res) => {
    const { itemId } = req.params;
    const { position, cachedData } = req.body;
    const list = req.resource;

    const itemIndex = list.items.findIndex(item => item.externalId === itemId);
    if (itemIndex === -1) {
        return errorResponse(res, 'Item not found in the list', 404);
    }

    if (position !== undefined) {
        if (position < 1 || position > 10) {
            return errorResponse(res, 'Position must be between 1 and 10', 400);
        }
        list.items[itemIndex].position = position;
    }

    if (cachedData) {
        list.items[itemIndex].cachedData = {
            ...list.items[itemIndex].cachedData,
            ...cachedData
        };
    }

    list.items.sort((a, b) => a.position - b.position);
    await list.save();
    return successResponse(res, list, 'Item updated successfully', 200);
}

// Remove item from list
const removeListItem = async (req, res) => {
    const { itemId } = req.params;
    const list = req.resource;

    const itemIndex = list.items.findIndex(item => item.externalId === itemId);
    if (itemIndex === -1) {
        return errorResponse(res, 'Item not found in the list', 404);
    }

    const newItems = list.items.filter(item => item.externalId !== itemId);
    newItems.forEach((item, index) => {
        item.position = index + 1;
    });
    list.items = newItems;

    await list.save();
    return successResponse(res, list, 'Item removed successfully', 200);
}

// Reorder items in list
const reorderListItems = async (req, res) => {
    const { items } = req.body; // Array of { externalId, position }
    const list = req.resource;

    if (!Array.isArray(items)) {
        return errorResponse(res, 'Items must be an array', 400);
    }

    items.forEach(({ externalId, position }) => {
        const item = list.items.find(item => item.externalId === externalId);
        if (item) {
            item.position = position;
        }
    });

    list.items.sort((a, b) => a.position - b.position);
    await list.save();
    return successResponse(res, list, 'Items reordered successfully', 200);
}

// Generate share token for a list
const generateShareToken = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (list.userId.toString() !== userId.toString()) {
        return errorResponse(res, 'Not authorized', 403);
    }

    await list.generateShareToken();

    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
    return successResponse(res, {
        shareToken: list.shareToken,
        shareUrl: `${backendUrl}/api/lists/s/${list.shareToken}`
    }, 'Share token generated successfully');
};

// Get list by share token (public access)
const getListByShareToken = async (req, res) => {
    const { token } = req.params;

    const currentUser = req.auth?.uid
        ? await User.findOne({ firebaseUid: req.auth.uid }).select('_id').lean()
        : null;

    const list = await List.findOne({ shareToken: token, isPublic: true });

    if (!list) {
        return errorResponse(res, 'List not found or not public', 404);
    }

    await list.incrementViews();
    await list.populate('user', 'displayName');

    const payload = list.toObject({ virtuals: true });
    payload.user = list.user
        ? { _id: list.user._id.toString(), displayName: list.user.displayName }
        : null;

    payload.userHasLiked = currentUser
        ? list.likes.some((id) => id.equals(currentUser._id))
        : false;

    payload.likesCount = list.likesCount ?? list.likes.length;

    return successResponse(res, payload);
}

// Get existing share token (if exitst)
const getShareToken = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (list.userId.toString() !== userId.toString()) {
        return errorResponse(res, 'Not authorized', 403);
    }

    if (!list.isPublic) {
        return errorResponse(res, 'List must be public to share', 400);
    }

    if (list.shareToken) {
        const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
        return successResponse(res, {
            shareToken: list.shareToken,
            shareUrl: `${backendUrl}/api/lists/s/${list.shareToken}`
        });
    }

    return successResponse(res, { shareToken: null, shareUrl: null }, 'No share token exists');
}

// Reset share token
const resetShareToken = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (list.userId.toString() !== userId.toString()) {
        return errorResponse(res, 'Not authorized', 403);
    }

    list.shareToken = undefined;
    await list.save();

    return successResponse(res, { message: 'Share token reset successfully' });
}

const renderSharePreview = async (req, res) => {
    try {
        const { token } = req.params;

        let frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        let backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

        if (backendUrl.includes('ngrok') && !backendUrl.startsWith('https://')) {
            backendUrl = backendUrl.replace('http://', 'https://');
        }

        let spaUrl;
        if (frontendUrl.includes('localhost') && backendUrl.includes('ngrok')) {
            spaUrl = `${backendUrl}/share/${token}`;
        } else if (!frontendUrl.includes('localhost')) {
            spaUrl = `${frontendUrl}/share/${token}`;
        } else {
            spaUrl = `${frontendUrl}/share/${token}`;
        }

        const list = await List.findOne({ shareToken: token, isPublic: true }).populate('user', 'displayName');
        if (!list) {
            return res
                .status(404)
                .send('<!doctype html><html><head><meta charset="utf-8"><title>Not found</title></head><body>Not found</body></html>');
        }

        const htmlEscape = (str) => {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const author = list.user?.displayName || 'User';
        const safeAuthor = htmlEscape(author);
        const safeTitle = htmlEscape(list.title || 'TopMeUp List');
        const pageTitle = `${safeTitle} by ${safeAuthor}`;

        const descriptionRaw = list.description || `Top-10 ${list.category === 'movies' ? 'movies' : list.category === 'music' ? 'albums' : 'games'} on TopMeUp`;
        const safeDescription = htmlEscape(descriptionRaw);

        const listUpdatedAt = list.updatedAt || list.createdAt;
        const version = Math.floor(new Date(listUpdatedAt).getTime() / 1000);
        const ogImage = `${backendUrl}/api/lists/preview/${token}?v=${version}`;

        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${pageTitle}</title>
<link rel="canonical" href="${spaUrl}" />

<!-- Open Graph -->
<meta property="og:title" content="${pageTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${spaUrl}" />
<meta property="og:site_name" content="TopMeUp" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:secure_url" content="${ogImage}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${pageTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${ogImage}" />
<meta name="twitter:image:alt" content="${pageTitle}" />

<!-- Redirect humans to SPA -->
<meta http-equiv="refresh" content="0; url=${spaUrl}" />
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px}</style>
<noscript><meta http-equiv="refresh" content="0; url=${spaUrl}" /></noscript>
</head>
<body>
<p>Opening… If you are not redirected, <a href="${spaUrl}">click here</a>.</p>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (e) {
        console.error('Error rendering share preview:', e);
        return res.status(500).send('Internal server error');
    }
};

const generateListPreview = async (req, res) => {
    try {
        const { token } = req.params;
        const sharp = require('sharp');
        const fetch = require('node-fetch');

        const list = await List.findOne({ shareToken: token, isPublic: true }).populate('user', 'displayName');
        if (!list) {
            res.setHeader('Content-Type', 'image/png');
            return res.status(404).send('List not found');
        }

        const exportWidth = 700;
        const pagePadding = 30;
        const gridMaxWidth = 660;
        const gridGap = 16;
        const cols = 2;
        const rows = 5;

        const posterCfg = {
            movies: { w: 64, h: 96 },
            music: { w: 64, h: 64 },
            games: { w: 96, h: null, aspect: 16 / 9 },
        };
        const pc = posterCfg[list.category] || posterCfg.movies;
        const posterW = pc.w;
        const posterH = pc.h ?? Math.round(pc.w / pc.aspect);

        const cardPadV = 8;
        const cardPadH = 10;
        const cardGap = 10;

        const textTitleSize = 14;
        const textMetaSize = 12;
        const textYearSize = 11;

        const cardHeight = Math.max(posterH + cardPadV * 2, 84);

        const headerTitleSize = 24;
        const headerSubSize = 13;
        const headerMarginBottom = 20;
        const headerSubMargin = 5;

        const headerHeight = pagePadding + headerTitleSize + headerSubMargin + headerSubSize + headerMarginBottom;

        const watermarkPaddingTop = 30;
        const watermarkPaddingBottom = 10;
        const watermarkMarginTop = 20;
        const watermarkHeight = watermarkPaddingTop + 14 + watermarkPaddingBottom;

        const contentHeight = headerHeight + rows * cardHeight + (rows - 1) * gridGap + watermarkMarginTop + watermarkHeight + pagePadding;

        const outW = 1200, outH = 630;

        const scale = outH / contentHeight;
        const S = (n) => Math.round(n * scale);

        const scaledWidth = S(exportWidth);
        const scaledHeight = S(contentHeight);

        const offsetX = Math.floor((outW - scaledWidth) / 2);
        const offsetY = Math.floor((outH - scaledHeight) / 2);

        const base = sharp({
            create: { width: outW, height: outH, channels: 3, background: { r: 255, g: 255, b: 255 } }
        });
        const composite = [];

        const esc = (s) => (typeof s === 'string' ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');
        const title = esc(list.title || 'TopMeUp List');
        const author = esc(list.user?.displayName || 'User');

        const headerSvg = `
          <svg width="${outW}" height="${S(headerHeight)}" xmlns="http://www.w3.org/2000/svg">
            <text x="${outW / 2}" y="${S(pagePadding + headerTitleSize)}"
                  fill="#111827" font-family="Arial, Helvetica, sans-serif"
                  font-weight="700" font-size="${S(headerTitleSize)}" text-anchor="middle">${title}</text>
            <text x="${outW / 2}" y="${S(pagePadding + headerTitleSize + headerSubMargin + headerSubSize)}"
                  fill="#666666" font-family="Arial, Helvetica, sans-serif"
                  font-size="${S(headerSubSize)}" text-anchor="middle">by ${author}</text>
          </svg>`;
        composite.push({ input: Buffer.from(headerSvg), top: offsetY, left: 0 });

        const loadImg = async (url) => {
            if (!url) {
                return null;
            }
            try {
                const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
                const proxied = `${backendUrl}/api/proxy/img?url=${encodeURIComponent(url)}`;

                const r = await fetch(proxied, {
                    headers: {
                        'User-Agent': 'TopMeUp-Preview-Generator/1.0 (Social Media Bot)'
                    },
                    timeout: 10000
                });

                if (!r.ok) {
                    return null;
                }

                const ab = await r.arrayBuffer();
                const buffer = Buffer.from(ab);
                return buffer;
            } catch (err) {
                console.warn(`[Preview] Error loading image: ${url}`, err.message);
                return null;
            }
        };

        const ellipsis = (s, max) => (s && s.length > max ? s.slice(0, max - 1) + '…' : (s || ''));

        const slots = Array.from({ length: 10 }).map((_, i) => list.items?.[i] || null);

        const sGridMaxW = S(gridMaxWidth);
        const sGap = S(gridGap);
        const sColW = S((gridMaxWidth - gridGap) / cols);
        const sPW = S(posterW);
        const sPH = S(posterH);
        const sPadV = S(cardPadV);
        const sPadH = S(cardPadH);
        const sCardGap = S(cardGap);
        const sCardH = S(cardHeight);
        const sHeadH = S(headerHeight);
        const sPad = S(pagePadding);
        const sTextW = sColW - sPadH * 2 - sPW - sCardGap;

        const gridStartX = offsetX + Math.floor((scaledWidth - sGridMaxW) / 2);

        let loadedPosters = 0;
        let failedPosters = 0;

        for (let i = 0; i < slots.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const cardX = gridStartX + col * (sColW + sGap);
            const cardY = offsetY + sHeadH + row * (sCardH + sGap);

            const item = slots[i];

            const posterX = cardX + sPadH;
            const posterY = cardY + sPadV;

            if (item?.cachedData?.posterUrl) {
                const raw = await loadImg(item.cachedData.posterUrl);
                if (raw) {
                    const fitted = await sharp(raw).resize(sPW, sPH, { fit: 'cover', position: 'center' }).toBuffer();
                    composite.push({ input: fitted, top: posterY, left: posterX });
                    loadedPosters++;
                } else {
                    const ph = await sharp({ create: { width: sPW, height: sPH, channels: 3, background: { r: 240, g: 240, b: 240 } } }).toBuffer();
                    composite.push({ input: ph, top: posterY, left: posterX });
                    failedPosters++;
                }
            } else {
                const ph = await sharp({ create: { width: sPW, height: sPH, channels: 3, background: { r: 240, g: 240, b: 240 } } }).toBuffer();
                composite.push({ input: ph, top: posterY, left: posterX });
            }

            if (!item) continue;

            const year = item.cachedData?.year ? String(item.cachedData.year) : '';
            const artist = list.category === 'music' ? (item.cachedData?.artist || '') : '';
            const t1 = ellipsis(item.title || 'No title', Math.max(10, Math.floor(sTextW / 7)));
            const t2 = list.category === 'music' && artist ? ellipsis(artist, Math.max(8, Math.floor(sTextW / 8))) : '';
            const t3 = year ? `(${year})` : '';

            const textX = cardX + sPadH + sPW + sCardGap;
            const textY = cardY + sPadV + S(4);

            const textSvg = `
            <svg width="${sTextW}" height="${sPH}" xmlns="http://www.w3.org/2000/svg">
              <style>
                .t1{fill:#111827;font-weight:600;font-size:${S(textTitleSize)}px;font-family:Arial, Helvetica, sans-serif}
                .t2{fill:#666666;font-size:${S(textMetaSize)}px;font-family:Arial, Helvetica, sans-serif}
                .t3{fill:#888888;font-size:${S(textYearSize)}px;font-family:Arial, Helvetica, sans-serif}
              </style>
              <text x="0" y="${S(16)}" class="t1">${esc(t1)}</text>
              ${t2 ? `<text x="0" y="${S(34)}" class="t2">${esc(t2)}</text>` : ''}
              ${t3 ? `<text x="0" y="${S(t2 ? 52 : 34)}" class="t3">${esc(t3)}</text>` : ''}
            </svg>`;
            composite.push({ input: Buffer.from(textSvg), top: textY, left: textX });
        }

        const watermarkY = offsetY + sHeadH + rows * sCardH + (rows - 1) * sGap + S(watermarkMarginTop);
        const wmSvg = `
          <svg width="${outW}" height="${S(watermarkHeight)}" xmlns="http://www.w3.org/2000/svg">
            <text x="${outW - S(16)}" y="${S(watermarkPaddingTop + 14)}"
                  fill="rgba(0,0,0,0.4)" font-weight="700"
                  font-size="${S(14)}" font-family="Arial, Helvetica, sans-serif"
                  text-anchor="end">topmeup.app</text>
          </svg>`;
        composite.push({ input: Buffer.from(wmSvg), top: watermarkY, left: 0 });

        const finalImage = await base.composite(composite).png().toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Disposition', 'inline; filename="preview.png"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        return res.send(finalImage);
    } catch (e) {
        console.error('[Preview] Error generating preview:', e);
        res.setHeader('Content-Type', 'image/png');
        return res.status(500).send('Error generating preview');
    }
};

const likeList = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (!list.isPublic) {
        return errorResponse(res, 'Cannot like a private list', 400);
    }

    if (list.userId.toString() === userId.toString()) {
        return errorResponse(res, 'Cannot like your own list', 400);
    }

    if (list.likes.some((id) => id.equals(userId))) {
        return successResponse(res, {
            listId: list._id,
            likesCount: list.likesCount,
            userHasLiked: true
        }, 'List already liked');
    }

    const updatedList = await list.addLike(userId);
    await User.findByIdAndUpdate(list.userId, { $inc: { 'stats.totalLikes': 1 } }).catch((err) => {
        console.warn('Failed to increment list owner likes:', err.message);
    });

    return successResponse(res, {
        listId: list._id,
        likesCount: updatedList.likesCount,
        userHasLiked: true
    }, 'List liked successfully');
};

const unlikeList = async (req, res) => {
    const list = req.resource;
    const userId = req.user._id;

    if (!list.likes.some((id) => id.equals(userId))) {
        return successResponse(res, {
            listId: list._id,
            likesCount: list.likesCount,
            userHasLiked: false
        }, 'List was not liked');
    }

    const updatedList = await list.removeLike(userId);
    await User.findByIdAndUpdate(list.userId, { $inc: { 'stats.totalLikes': -1 } }).catch((err) => {
        console.warn('Failed to decrement list owner likes:', err.message);
    });

    return successResponse(res, {
        listId: list._id,
        likesCount: updatedList.likesCount,
        userHasLiked: false
    }, 'List unliked successfully');
};



module.exports = {
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
};