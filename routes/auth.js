const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const REQUIRED_GUILD_ID = process.env.REQUIRED_GUILD_ID;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const OWNER_USER_ID = process.env.OWNER_USER_ID;
const DISCORD_INVITE_URL = process.env.DISCORD_INVITE_URL;

router.get('/login', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize` +
        `?client_id=${DISCORD_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=identify+guilds+guilds.members.read`;
    res.redirect(discordAuthUrl);
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.status(400).send('Failed to get token');
        }

        const [userResponse, guildsResponse, memberResponse] = await Promise.all([
            fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            }),
            fetch('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            }),
            fetch(`https://discord.com/api/users/@me/guilds/${REQUIRED_GUILD_ID}/member`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            })
        ]);

        const user = await userResponse.json();
        const guilds = await guildsResponse.json();

        const isMember = guilds.some(g => g.id === REQUIRED_GUILD_ID);

        if (!isMember) {
            return res.render('denied', { DISCORD_INVITE_URL });
        }

        let isAdmin = false;
        if (memberResponse.ok) {
            const member = await memberResponse.json();
            if (member.roles && (member.roles.includes(ADMIN_ROLE_ID) || user.id === OWNER_USER_ID)) {
                isAdmin = true;
            }
        }
        if (user.id === OWNER_USER_ID) isAdmin = true;

        req.session.user = {
            id: user.id,
            username: user.global_name || user.username,
            avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
            tag: user.username,
            loginAt: Date.now(),
            isAdmin: isAdmin
        };

        res.redirect('/dashboard');

    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).send('Authentication failed');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
