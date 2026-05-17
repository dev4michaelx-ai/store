const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('index', { user: req.session?.user || null });
});

router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { user: null });
});

router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

module.exports = router;
