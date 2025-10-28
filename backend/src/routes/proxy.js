const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/img', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
			return res.status(400).send('Invalid url');
		}

        const r = await fetch(targetUrl, { headers: { 'User-Agent': 'TopMeUp/1.0' } });
        if (!r.ok) return res.status(502).send('Upstream error');

        const ct = r.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const buf = Buffer.from(await r.arrayBuffer());
        res.end(buf);
    } catch (e) {
        res.status(502).send('Proxy fetch failed');
    }
});

module.exports = router;