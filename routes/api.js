const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Resource = require('../models/Resource');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024, files: 5 } });

router.get('/resources', async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 }).lean();
        res.json(resources.map(r => ({ ...r, id: r._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/upload', upload.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) return res.json({ images: [] });
    const imagePaths = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ images: imagePaths });
});

router.post('/resources', requireAdmin, async (req, res) => {
    try {
        const data = req.body.resource || req.body;
        const resource = await Resource.create(data);
        res.json({ success: true, resource });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/resources/:id', requireAdmin, async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!resource) return res.json({ error: 'Not found' });
        res.json({ success: true, resource });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/resources/:id', requireAdmin, async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/verify', (req, res) => {
    if (!req.session || !req.session.user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: req.session.user });
});

module.exports = { router };
