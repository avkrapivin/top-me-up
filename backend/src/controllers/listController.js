const { List, User, Comment } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { createPagination, createFilter, createSort } = require('../utils/paginationHelper');

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
    const { page = 1, limit = 10, category, sortBy = 'createdAt' } = req.query;

    const filter = createFilter({ isPublic: true }, { category });
    const sort = createSort(sortBy, 'desc');

    const lists = await List.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName');

    const total = await List.countDocuments(filter);
    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, lists, pagination);
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

    await list.save();

    // Update user's statistics
    await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.listsCreated': 1 }
    });

    return successResponse(res, list, 'List created successfully', 201);
};

// Get list by ID
const getListById = async (req, res) => {
    const list = req.resource;

    // Check if list is public or owned by the user
    const uid = req.auth?.uid;
    if (!list.isPublic) {
        if (!uid) return errorResponse(res, 'Authentication required', 401);
        const user = await User.findOne({ firebaseUid: uid });
        if (!user || list.userId.toString() !== user._id.toString()) {
            return errorResponse(res, 'Not authorized', 403);
        }
    }

    await list.populate('user', 'displayName');

    const isOwner = uid && await User.findOne({ firebaseUid: uid }).then(user =>
        user && list.userId.toString() === user._id.toString()
    );

    // Increment views count
    if (!isOwner) {
        await list.incrementViews();
    }

    return successResponse(res, list);
};

// Update list
const updateList = async (req, res) => {
    const { title, description, isPublic, items } = req.body;
    const list = req.resource;

    if (items && items.length > 10) {
        return errorResponse(res, 'List cannot have more than 10 items', 400);
    }

    if (title) list.title = title;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;
    if (items !== undefined) list.items = items;

    await list.save();

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
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
        listId: id,
        isDeleted: false,
        parentCommentId: null
    })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'displayName')
        .populate('replies');

    const total = await Comment.countDocuments({
        listId: id,
        isDeleted: false,
        parentCommentId: null
    });

    const pagination = createPagination(page, limit, total);

    return paginatedResponse(res, comments, pagination);
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

    const list = await List.findOne({ shareToken: token, isPublic: true });

    if (!list) {
        return errorResponse(res, 'List not found or not public', 404);
    }

    await list.populate('user', 'displayName');

    await list.incrementViews();

    return successResponse(res, list);
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

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

        const spaUrl = `${frontendUrl}/share/${token}`;

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

        const ogImage = `${backendUrl}/api/lists/preview/${token}`;

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
        if (!list) return res.status(404).send('List not found');

        const baseWidth = 700;
        const pagePadding = 30;
        const gridGap = 16;
        const cols = 2;

        const posterCfg = {
            movies: { w: 64, h: 96 },
            music: { w: 64, h: 64 },
            games: { w: 96, h: null, aspect: 16 / 9 },
        };
        const pc = posterCfg[list.category] || posterCfg.movies;
        const posterW = pc.w;
        const posterH = pc.h ?? Math.round(pc.w / pc.aspect);

        const cardPadV = 8;
        const cardPadH = 8;
        const gutterPosterText = 12;

        const textTitle = 14;
        const textMeta = 12;

        const colWidth = Math.floor((baseWidth - pagePadding * 2 - gridGap) / cols);
        const textBlockWidth = colWidth - cardPadH * 2 - posterW - gutterPosterText;
        const cardHeight = Math.max(posterH + cardPadV * 2, 84);

        const rows = 5;
        const headerTitle = 24;
        const headerSub = 13;
        const headerHeight = pagePadding + headerTitle + 5 + headerSub + 16;
        const watermarkHeight = 30;

        const baseHeight = headerHeight + rows * cardHeight + (rows - 1) * gridGap + pagePadding + watermarkHeight;

        const outW = 1200, outH = 630;

        const scaleByHeight = outH / baseHeight;
        const scaleByWidth = outW / baseWidth;
        const scale = Math.min(scaleByHeight, scaleByWidth);

        const S = (n) => Math.round(n * scale);

        const contentW = S(baseWidth);
        const contentH = S(baseHeight);

        const offsetX = Math.floor((outW - contentW) / 2);
        const offsetY = Math.floor((outH - contentH) / 2);

        const base = sharp({
            create: { width: outW, height: outH, channels: 3, background: { r: 255, g: 255, b: 255 } }
        });
        const composite = [];

        const esc = (s) => (typeof s === 'string' ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');
        const title = esc(list.title || 'TopMeUp List');
        const author = esc(list.user?.displayName || 'User');

        const headerSvg = `
          <svg width="${outW}" height="${S(headerHeight)}" xmlns="http://www.w3.org/2000/svg">
            <text x="${outW / 2}" y="${S(pagePadding + headerTitle)}"
                  fill="#111827" font-family="Arial, Helvetica, sans-serif"
                  font-weight="700" font-size="${S(headerTitle)}" text-anchor="middle">${title}</text>
            <text x="${outW / 2}" y="${S(pagePadding + headerTitle + 5 + headerSub)}"
                  fill="#6b7280" font-family="Arial, Helvetica, sans-serif"
                  font-size="${S(headerSub)}" text-anchor="middle">by ${author}</text>
          </svg>`;
        composite.push({ input: Buffer.from(headerSvg), top: offsetY, left: 0 });

        const loadImg = async (url) => {
            if (!url) return null;
            try {
                const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
                const proxied = `${backendUrl}/api/proxy/img?url=${encodeURIComponent(url)}`;
                const r = await fetch(proxied);
                if (!r.ok) return null;
                const ab = await r.arrayBuffer();
                return Buffer.from(ab);
            } catch { return null; }
        };
        const ellipsis = (s, max) => (s && s.length > max ? s.slice(0, max - 1) + '…' : (s || ''));

        const slots = Array.from({ length: 10 }).map((_, i) => list.items?.[i] || null);

        const colW = S(colWidth);
        const padV = S(cardPadV);
        const padH = S(cardPadH);
        const gap = S(gridGap);
        const pW = S(posterW);
        const pH = S(posterH);
        const tW = S(textBlockWidth);
        const mid = S(gutterPosterText);
        const cardH = S(cardHeight);
        const headH = S(headerHeight);
        const pad = S(pagePadding);

        for (let i = 0; i < slots.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const x = offsetX + pad + col * (colW + gap);
            const y = offsetY + headH + row * (cardH + gap);

            const item = slots[i];

            if (item?.cachedData?.posterUrl) {
                const raw = await loadImg(item.cachedData.posterUrl);
                if (raw) {
                    const fitted = await sharp(raw).resize(pW, pH, { fit: 'cover', position: 'center' }).toBuffer();
                    composite.push({ input: fitted, top: y + padV, left: x + padH });
                } else {
                    const ph = await sharp({ create: { width: pW, height: pH, channels: 3, background: { r: 229, g: 231, b: 235 } } }).toBuffer();
                    composite.push({ input: ph, top: y + padV, left: x + padH });
                }
            } else {
                const ph = await sharp({ create: { width: pW, height: pH, channels: 3, background: { r: 229, g: 231, b: 235 } } }).toBuffer();
                composite.push({ input: ph, top: y + padV, left: x + padH });
            }

            if (!item) continue;

            const year = item.cachedData?.year ? String(item.cachedData.year) : '';
            const artist = list.category === 'music' ? (item.cachedData?.artist || '') : '';
            const t1 = ellipsis(item.title || '', Math.max(10, Math.floor(tW / Math.max(7, S(7)))));
            const t2 = list.category === 'music' && artist ? ellipsis(artist, Math.max(8, Math.floor(tW / Math.max(8, S(8))))) : '';
            const t3 = year;

            const tx = x + padH + pW + mid;
            const ty = y + padV + S(4);

            const textSvg = `
            <svg width="${tW}" height="${pH}" xmlns="http://www.w3.org/2000/svg">
              <style>
                .t1{fill:#111827;font-weight:600;font-size:${S(textTitle)}px;font-family:Arial, Helvetica, sans-serif}
                .t2{fill:#4b5563;font-size:${S(textMeta)}px;font-family:Arial, Helvetica, sans-serif}
                .t3{fill:#6b7280;font-size:${S(textMeta)}px;font-family:Arial, Helvetica, sans-serif}
              </style>
              <text x="0" y="${S(16)}" class="t1">${esc(t1)}</text>
              ${t2 ? `<text x="0" y="${S(34)}" class="t2">${esc(t2)}</text>` : ''}
              ${t3 ? `<text x="0" y="${S(t2 ? 52 : 34)}" class="t3">${esc(t3)}</text>` : ''}
            </svg>`;
            composite.push({ input: Buffer.from(textSvg), top: ty, left: tx });
        }

        const watermarkY = offsetY + headH + rows * cardH + (rows - 1) * gap + pad;
        const wmSvg = `
          <svg width="${outW}" height="${S(watermarkHeight)}" xmlns="http://www.w3.org/2000/svg">
            <text x="${outW - S(16)}" y="${S(watermarkHeight - 8)}"
                  fill="rgba(0,0,0,0.35)" font-weight="700"
                  font-size="${S(14)}" font-family="Arial, Helvetica, sans-serif"
                  text-anchor="end">topmeup.app</text>
          </svg>`;
        composite.push({ input: Buffer.from(wmSvg), top: watermarkY, left: 0 });

        const finalImage = await base.composite(composite).png().toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Disposition', 'inline; filename="preview.png"');
        return res.send(finalImage);
    } catch (e) {
        console.error('Error generating preview:', e);
        return res.status(500).send('Error generating preview');
    }
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
    generateListPreview
};