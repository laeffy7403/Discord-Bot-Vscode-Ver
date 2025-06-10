// package.json dependencies needed:
// npm install discord.js@13.17.1 sqlite3
require("dotenv").config();
const { Client, Intents, MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Bot configuration
// const DIS_TOKEN = 'OTcwMjgzNjEzODE4MDczMDk4.GnHYzd.5MaURseEEXnkLHwMCwm_B76EI3K1wHO7EhJat0';
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT
    ]
});

// Initialize SQLite database
const dbPath = path.join(__dirname, '../photos.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS photo_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        server_id TEXT NOT NULL,
        server_name TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS user_totals (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        server_id TEXT NOT NULL,
        total_photos INTEGER DEFAULT 1,
        last_upload DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Helper function to check if message has images
function hasImages(message) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return message.attachments.some(attachment => 
        imageExtensions.some(ext => attachment.name?.toLowerCase().endsWith(ext))
    );
}

// Helper function to get image attachments
function getImageAttachments(message) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return message.attachments.filter(attachment => 
        imageExtensions.some(ext => attachment.name?.toLowerCase().endsWith(ext))
    );
}

// Track photo uploads
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message has images
    if (hasImages(message)) {
        const imageAttachments = getImageAttachments(message);
        
        imageAttachments.forEach(attachment => {
            const fileType = path.extname(attachment.name).toLowerCase();
            
            // Insert photo record
            db.run(`INSERT INTO photo_stats 
                    (user_id, username, server_id, server_name, channel_id, channel_name, file_type, file_size) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    message.author.id,
                    message.author.username,
                    message.guild.id,
                    message.guild.name,
                    message.channel.id,
                    message.channel.name,
                    fileType,
                    attachment.size
                ]
            );
            
            // Update user totals
            db.run(`INSERT OR REPLACE INTO user_totals 
                    (user_id, username, server_id, total_photos, last_upload) 
                    VALUES (?, ?, ?, 
                        COALESCE((SELECT total_photos FROM user_totals WHERE user_id = ?), 0) + 1,
                        CURRENT_TIMESTAMP)`,
                [
                    message.author.id,
                    message.author.username,
                    message.guild.id,
                    message.author.id
                ]
            );
        });
        
        console.log(`📸 ${message.author.username} uploaded ${imageAttachments.size} image(s) in #${message.channel.name}`);
    }
});

// Prefix commands (since slash commands are more complex in v13)
const PREFIX = '!';

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        switch (command) {
            case 'mystats':
                await handleMyStats(message);
                break;
            case 'photostats':
                await handlePhotoStats(message, args);
                break;
            case 'toposters':
                await handleTopPosters(message);
                break;
            case 'serverstats':
                await handleServerStats(message);
                break;
            case 'channelstats':
                await handleChannelStats(message, args);
                break;
            case 'help':
                await handleHelp(message);
                break;
        }
    } catch (error) {
        console.error('Command error:', error);
        message.reply('An error occurred while processing your command.');
    }
});

// Command handlers
async function handleMyStats(message) {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    db.get(`SELECT * FROM user_totals WHERE user_id = ? AND server_id = ?`, 
        [userId, serverId], 
        async (err, row) => {
            if (err) {
                console.error(err);
                return message.reply('Database error occurred.');
            }
            
            if (!row) {
                return message.reply('You haven\'t uploaded any photos yet!');
            }
            
            const embed = new MessageEmbed()
                .setTitle('📸 Your Photo Statistics')
                .setColor(0x0099FF)
                .addFields(
                    { name: 'Total Photos', value: row.total_photos.toString(), inline: true },
                    { name: 'Last Upload', value: new Date(row.last_upload).toLocaleDateString(), inline: true }
                )
                .setFooter({ text: `Stats for ${message.author.username}` });
            
            message.reply({ embeds: [embed] });
        });
}

async function handlePhotoStats(message, args) {
    let targetUser;
    
    // Check if user mentioned someone or provided user ID
    if (message.mentions.users.size > 0) {
        targetUser = message.mentions.users.first();
    } else if (args[0]) {
        try {
            targetUser = await client.users.fetch(args[0]);
        } catch {
            return message.reply('User not found! Please mention a user or provide a valid user ID.');
        }
    } else {
        return message.reply('Please mention a user or provide a user ID. Example: `!photostats @username`');
    }
    
    const serverId = message.guild.id;
    
    db.get(`SELECT * FROM user_totals WHERE user_id = ? AND server_id = ?`, 
        [targetUser.id, serverId], 
        async (err, row) => {
            if (err) {
                console.error(err);
                return message.reply('Database error occurred.');
            }
            
            if (!row) {
                return message.reply(`${targetUser.username} hasn't uploaded any photos yet!`);
            }
            
            const embed = new MessageEmbed()
                .setTitle(`📸 Photo Statistics for ${targetUser.username}`)
                .setColor(0x0099FF)
                .addFields(
                    { name: 'Total Photos', value: row.total_photos.toString(), inline: true },
                    { name: 'Last Upload', value: new Date(row.last_upload).toLocaleDateString(), inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL());
            
            message.reply({ embeds: [embed] });
        });
}

async function handleTopPosters(message) {
    const serverId = message.guild.id;
    
    db.all(`SELECT username, total_photos FROM user_totals 
            WHERE server_id = ? ORDER BY total_photos DESC LIMIT 10`, 
        [serverId], 
        async (err, rows) => {
            if (err) {
                console.error(err);
                return message.reply('Database error occurred.');
            }
            
            if (!rows || rows.length === 0) {
                return message.reply('No photo statistics available yet!');
            }
            
            const leaderboard = rows.map((row, index) => 
                `${index + 1}. **${row.username}** - ${row.total_photos} photos`
            ).join('\n');
            
            const embed = new MessageEmbed()
                .setTitle('🏆 Top Photo Contributors')
                .setDescription(leaderboard)
                .setColor(0xFFD700);
            
            message.reply({ embeds: [embed] });
        });
}

async function handleServerStats(message) {
    const serverId = message.guild.id;
    
    db.all(`SELECT 
                COUNT(*) as total_photos,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT channel_id) as channels_used,
                AVG(file_size) as avg_file_size
            FROM photo_stats WHERE server_id = ?`, 
        [serverId], 
        async (err, rows) => {
            if (err) {
                console.error(err);
                return message.reply('Database error occurred.');
            }
            
            const stats = rows[0];
            
            const embed = new MessageEmbed()
                .setTitle(`📊 Server Photo Statistics - ${message.guild.name}`)
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Total Photos', value: stats.total_photos.toString(), inline: true },
                    { name: 'Active Users', value: stats.unique_users.toString(), inline: true },
                    { name: 'Channels Used', value: stats.channels_used.toString(), inline: true },
                    { name: 'Avg File Size', value: `${Math.round(stats.avg_file_size / 1024)} KB`, inline: true }
                );
            
            message.reply({ embeds: [embed] });
        });
}

async function handleChannelStats(message, args) {
    let channel = message.channel;
    
    // If channel mentioned, use that instead
    if (message.mentions.channels.size > 0) {
        channel = message.mentions.channels.first();
    }
    
    const serverId = message.guild.id;
    
    db.all(`SELECT COUNT(*) as photo_count, COUNT(DISTINCT user_id) as unique_users
            FROM photo_stats WHERE server_id = ? AND channel_id = ?`, 
        [serverId, channel.id], 
        async (err, rows) => {
            if (err) {
                console.error(err);
                return message.reply('Database error occurred.');
            }
            
            const stats = rows[0];
            
            const embed = new MessageEmbed()
                .setTitle(`📈 Channel Photo Statistics - #${channel.name}`)
                .setColor(0xFF6B6B)
                .addFields(
                    { name: 'Total Photos', value: stats.photo_count.toString(), inline: true },
                    { name: 'Contributors', value: stats.unique_users.toString(), inline: true }
                );
            
            message.reply({ embeds: [embed] });
        });
}

async function handleHelp(message) {
    const embed = new MessageEmbed()
        .setTitle('📸 Photo Tracker Bot Commands')
        .setDescription('Track photo uploads in your server!')
        .setColor(0x9932CC)
        .addFields(
            { name: `${PREFIX}mystats`, value: 'View your photo upload statistics', inline: false },
            { name: `${PREFIX}photostats @user`, value: 'View photo statistics for a specific user', inline: false },
            { name: `${PREFIX}toposters`, value: 'View the top photo contributors leaderboard', inline: false },
            { name: `${PREFIX}serverstats`, value: 'View overall server photo statistics', inline: false },
            { name: `${PREFIX}channelstats`, value: 'View photo statistics for current channel', inline: false },
            { name: `${PREFIX}help`, value: 'Show this help message', inline: false }
        )
        .setFooter({ text: 'Bot automatically tracks image uploads!' });
    
    message.reply({ embeds: [embed] });
}

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online and tracking photos!`);
    console.log(`📝 Use prefix "${PREFIX}" for commands (e.g., ${PREFIX}help)`);
});

// Login to Discord
client.login(process.env.DIS_TOKEN);
