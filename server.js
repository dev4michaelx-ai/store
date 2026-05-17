require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// View engine
app.set('view engine', 'ejs');

// Force HTTPS in production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Routes
const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const { router: apiRouter } = require('./routes/api');
const { router: ticketsRouter, setBot } = require('./routes/tickets');

app.use('/', pagesRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/api/tickets', ticketsRouter);

// Discord Bot
const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

const AUTO_ROLE_ID = process.env.AUTO_ROLE_ID || '1499536878787891424';

bot.on('ready', () => {
    console.log(`  Ticket Bot: ${bot.user.tag}`);
});

bot.on('guildMemberAdd', async (member) => {
    try {
        await member.roles.add(AUTO_ROLE_ID);
        console.log(`  Auto-assigned role to: ${member.user.username} (${member.id})`);
    } catch (err) {
        console.error('  Failed to assign auto role:', err.message);
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'close_ticket') return;

    await interaction.reply({ content: 'Closing ticket...', ephemeral: true });

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages.reverse().map(m =>
        `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '[Attachment]'}`
    ).join('\n');

    try {
        const dmChannel = await interaction.user.createDM();
        await dmChannel.send(`**Ticket Transcript:**\n\`\`\`\n${transcript}\n\`\`\``);
    } catch { }

    await channel.delete();
});

setBot(bot);

bot.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('  Ticket Bot failed to login:', err.message);
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  4MC Server running`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Guild Lock: ${process.env.REQUIRED_GUILD_ID}`);
    console.log(`  Admin Role: ${process.env.ADMIN_ROLE_ID}`);
    console.log(`========================================\n`);
});
