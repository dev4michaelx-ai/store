const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { Client, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const REQUIRED_GUILD_ID = process.env.REQUIRED_GUILD_ID;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
let bot = null;

function setBot(b) { bot = b; }

let ticketCounter = 0;

router.post('/', requireAuth, async (req, res) => {
    const { reason } = req.body;
    const userData = req.session.user;

    try {
        if (!bot || !bot.isReady()) {
            return res.json({ error: 'Ticket bot not connected' });
        }

        const guild = bot.guilds.cache.get(REQUIRED_GUILD_ID);
        if (!guild) return res.json({ error: 'Guild not found' });

        let member;
        try {
            member = await guild.members.fetch(userData.id);
        } catch {
            return res.json({ error: 'User not found in server. Please join the Discord server first.' });
        }

        ticketCounter++;
        const channelName = `ticket-${member.user.username.toLowerCase()}-${ticketCounter}`;

        const category = TICKET_CATEGORY_ID && TICKET_CATEGORY_ID !== 'YOUR_TICKET_CATEGORY_ID_HERE'
            ? guild.channels.cache.get(TICKET_CATEGORY_ID)
            : null;

        const overwrites = [
            { id: guild.id, type: 0, allow: '0', deny: String(PermissionFlagsBits.ViewChannel) },
            { id: member.id, type: 1, allow: String(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory), deny: '0' },
            { id: ADMIN_ROLE_ID, type: 0, allow: String(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory), deny: '0' }
        ];

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category?.id,
            topic: `Ticket for: ${member.displayName}`,
            permissionOverwrites: overwrites
        });

        const qrUrl = 'https://cdn.discordapp.com/attachments/1501532866159317123/1501533233706172550/qrc.png?ex=69fc6b4c&is=69fb19cc&hm=dbcdbfa74f8ae9977ddf269d3f5d40ea6879483f1fdfa19b4541fcf490abe36e';

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('Payment QR Code')
            .setDescription('Scan the QR code below to complete your payment.')
            .setImage(qrUrl)
            .setFooter({ text: 'Payment required to proceed' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        const ticketMessage = reason
            ? `**Ticket created by ${member.displayName}**\n**Reason:** ${reason}`
            : `**Ticket created by ${member.displayName}**`;

        await channel.send({ content: ticketMessage, embeds: [embed], components: [row] });

        res.json({
            success: true,
            channelId: channel.id,
            discordUrl: `discord://-/channels/${REQUIRED_GUILD_ID}/${channel.id}`,
            webUrl: `https://discord.com/channels/${REQUIRED_GUILD_ID}/${channel.id}`
        });

    } catch (err) {
        console.error('Ticket creation error:', err);
        res.json({ error: 'Failed to create ticket', details: err.message });
    }
});

module.exports = { router, setBot, getBot: () => bot };
