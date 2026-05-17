function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/auth/login');
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ error: 'Admin only' });
}

module.exports = { requireAuth, requireAdmin };
