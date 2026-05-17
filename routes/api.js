const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const RESOURCES_FILE = path.join(__dirname, '..', 'resources.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024, files: 5 } });

function loadResources() {
    if (fs.existsSync(RESOURCES_FILE)) {
        return JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'));
    }
    const defaults = [
        { id: '1', name: 'Advanced HUD System', category: 'script', description: 'Modern HUD with health, armor, hunger, thirst indicators and clean design.', badge: 'new', downloads: '12.4k', rating: '4.9', time: '2d ago', images: [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600",
            "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600"
        ]},
        { id: '2', name: 'Custom Inventory System', category: 'script', description: 'Full inventory with drag & drop, hotbar, and item metadata support.', badge: 'hot', downloads: '15.1k', rating: '4.8', time: '1w ago', images: [
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600",
            "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=600"
        ]},
        { id: '3', name: 'Phone Interface', category: 'script', description: 'Smartphone UI with messaging, contacts, gallery, banking, and social media.', badge: '', downloads: '9.8k', rating: '4.6', time: '2w ago', images: [] },
        { id: '4', name: 'Admin Panel Pro', category: 'script', description: 'Complete admin dashboard with player management, logs, and moderation tools.', badge: 'updated', downloads: '11.7k', rating: '4.9', time: '1mo ago', images: [] },
        { id: '5', name: 'Job System V2', category: 'script', description: 'Advanced job system with multiple professions, progression, and payouts.', badge: 'new', downloads: '7.2k', rating: '4.7', time: '3d ago', images: [] },
        { id: '6', name: 'Downtown MLO Pack', category: 'maps', description: 'High-quality interior MLOs for downtown area including offices and shops.', badge: '', downloads: '8.5k', rating: '4.5', time: '5d ago', images: [] },
        { id: '7', name: 'Police Station MLO', category: 'maps', description: 'Detailed police station interior with cells, office, garage, and rooftop.', badge: '', downloads: '6.1k', rating: '4.8', time: '1w ago', images: [] },
        { id: '8', name: 'Custom Map Pack Vol 3', category: 'maps', description: 'Over 50 custom map objects including buildings, props, and decorations.', badge: 'hot', downloads: '10.3k', rating: '4.6', time: '2w ago', images: [] },
        { id: '9', name: 'Supercar Pack 2026', category: 'vehicle', description: '20 high-quality supercars with custom handling and realistic interiors.', badge: 'new', downloads: '14.2k', rating: '4.9', time: '1d ago', images: [] },
        { id: '10', name: 'Emergency Vehicles Pack', category: 'vehicle', description: 'Police, fire, ambulance vehicles with custom liveries and lightbar systems.', badge: '', downloads: '9.1k', rating: '4.7', time: '4d ago', images: [] },
        { id: '11', name: 'JDM Legends Pack', category: 'vehicle', description: 'Classic JDM cars from the 90s with tuning parts and drift setup.', badge: '', downloads: '11.5k', rating: '4.8', time: '2w ago', images: [] },
        { id: '12', name: 'Streetwear Collection', category: 'clothing', description: 'Modern streetwear outfits with hoodies, jackets, sneakers, and accessories.', badge: 'new', downloads: '8.9k', rating: '4.5', time: '3d ago', images: [] },
        { id: '13', name: 'Tactical Gear Pack', category: 'clothing', description: 'Military and tactical clothing with vests, helmets, and combat boots.', badge: '', downloads: '6.4k', rating: '4.6', time: '1w ago', images: [] },
        { id: '14', name: 'Formal Wear Collection', category: 'clothing', description: 'Suits, dresses, formal shoes, and business attire for roleplay.', badge: '', downloads: '5.2k', rating: '4.4', time: '2w ago', images: [] },
        { id: '15', name: 'Server Optimizer Tool', category: 'tool', description: 'Performance monitoring and optimization tools for server stability.', badge: 'updated', downloads: '7.8k', rating: '4.7', time: '5d ago', images: [] },
        { id: '16', name: 'Resource Manager CLI', category: 'tool', description: 'Command-line tool for managing, installing, and updating resources.', badge: '', downloads: '4.3k', rating: '4.5', time: '2w ago', images: [] },
        { id: '17', name: 'Luxury Brand Pack', category: 'fashion', description: 'Premium fashion items including designer brands, watches, and accessories.', badge: 'hot', downloads: '18.9k', rating: '4.8', time: '1mo ago', images: [] },
        { id: '18', name: 'Urban Style Collection', category: 'fashion', description: 'Modern urban fashion with oversized fits, chains, and limited edition pieces.', badge: 'new', downloads: '12.1k', rating: '4.9', time: '1d ago', images: [] }
    ];
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
}

function saveResources(resources) {
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2));
}

router.get('/resources', (req, res) => {
    res.json(loadResources());
});

router.post('/upload', upload.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) return res.json({ images: [] });
    const imagePaths = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ images: imagePaths });
});

router.post('/resources', requireAdmin, (req, res) => {
    const { resource } = req.body;
    const resources = loadResources();
    resource.id = Date.now().toString();
    resource.images = resource.images || [];
    resources.unshift(resource);
    saveResources(resources);
    res.json({ success: true, resource });
});

router.put('/resources/:id', requireAdmin, (req, res) => {
    const resources = loadResources();
    const idx = resources.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.json({ error: 'Not found' });
    resources[idx] = { ...resources[idx], ...req.body };
    saveResources(resources);
    res.json({ success: true });
});

router.delete('/resources/:id', requireAdmin, (req, res) => {
    let resources = loadResources();
    resources = resources.filter(r => r.id !== req.params.id);
    saveResources(resources);
    res.json({ success: true });
});

router.get('/verify', (req, res) => {
    if (!req.session || !req.session.user) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: req.session.user });
});

module.exports = { router, loadResources, saveResources };
