require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs-extra");
const moment = require("moment");
const axios = require("axios");

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_WEBHOOKS,
    Discord.Intents.FLAGS.GUILD_INVITES,
  ]
});

// Create necessary directories
fs.ensureDirSync('./logs');
fs.ensureDirSync('./data');
fs.ensureDirSync('./data/messages');
fs.ensureDirSync('./data/webhooks');

// Enhanced logging with severity levels
function logAccess(type, userId, targetData, severity = 'INFO') {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = `[${timestamp}] [${severity}] ${type} | User: ${userId} | Target: ${JSON.stringify(targetData)}\n`;
  fs.appendFileSync('./logs/access.log', logEntry);
  
  // Also log high severity actions separately
  if (severity === 'HIGH' || severity === 'CRITICAL') {
    fs.appendFileSync('./logs/critical.log', logEntry);
  }
}

function exportUserData(data, filename) {
  fs.writeJsonSync(`./data/${filename}`, data, { spaces: 2 });
}

// Message collection database
let messageDatabase = {};

client.once('ready', c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log('⚠️  Advanced Security Research Bot Active');
  console.log('📊 Logging: ENABLED | 💾 Data Export: ENABLED | 🕵️ Monitoring: ACTIVE');
  console.log('⚡ Message Scraping: READY | 🔗 Webhook Analysis: READY');
});

// Passive message collection (runs in background)
client.on('messageCreate', async msg => {
  // Collect all messages for analysis (passive monitoring)
  if (!messageDatabase[msg.channel.id]) {
    messageDatabase[msg.channel.id] = [];
  }
  
  messageDatabase[msg.channel.id].push({
    messageId: msg.id,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      bot: msg.author.bot
    },
    content: msg.content,
    timestamp: msg.createdAt.toISOString(),
    attachments: msg.attachments.map(a => a.url),
    embeds: msg.embeds.length
  });

  // Keep only last 1000 messages per channel to prevent memory issues
  if (messageDatabase[msg.channel.id].length > 1000) {
    messageDatabase[msg.channel.id].shift();
  }

  if (msg.author.bot) return;

  // === BASIC COMMANDS ===
  
  if (msg.content === '!myid') {
    logAccess('SELF_ID_CHECK', msg.author.id, { username: msg.author.username }, 'INFO');
    msg.reply(`Your Discord User ID is: \`${msg.author.id}\``);
  }

  if (msg.content.startsWith('!userid')) {
    if (msg.mentions.users.size > 0) {
      const user = msg.mentions.users.first();
      logAccess('USER_ID_LOOKUP', msg.author.id, { targetUser: user.username, targetId: user.id }, 'INFO');
      msg.reply(`User ID of ${user.username}: \`${user.id}\``);
    } else {
      msg.reply('Please mention a user! Usage: !userid @username');
    }
  }

  if (msg.content === '!serverids') {
    try {
      const members = await msg.guild.members.fetch();
      let userList = '**Server Member IDs (Exposed):**\n\n';
      const exportData = [];
      
      members.forEach(member => {
        userList += `${member.user.username}: \`${member.user.id}\`\n`;
        exportData.push({
          username: member.user.username,
          id: member.user.id,
          isBot: member.user.bot
        });
      });

      exportUserData(exportData, `server_${msg.guild.id}_members.json`);
      logAccess('MASS_ID_EXTRACTION', msg.author.id, { serverName: msg.guild.name, count: members.size }, 'HIGH');

      if (userList.length > 2000) {
        const chunks = userList.match(/[\s\S]{1,1900}/g);
        chunks.forEach(chunk => msg.channel.send(chunk));
      } else {
        msg.channel.send(userList);
      }
      msg.channel.send(`📁 Data exported to: \`server_${msg.guild.id}_members.json\``);
    } catch (error) {
      msg.reply('Error fetching server members.');
      console.error(error);
    }
  }

  if (msg.content.startsWith('!userinfo')) {
    const user = msg.mentions.users.first() || msg.author;
    const member = msg.guild.members.cache.get(user.id);

    const userData = {
      username: user.username,
      id: user.id,
      discriminator: user.discriminator,
      createdAt: user.createdAt.toISOString(),
      bot: user.bot,
      avatarURL: user.displayAvatarURL({ dynamic: true, size: 512 })
    };

    if (member) {
      userData.joinedAt = member.joinedAt.toISOString();
      userData.roles = member.roles.cache.map(r => ({ name: r.name, id: r.id }));
      userData.nickname = member.nickname;
      userData.presence = member.presence?.status || 'offline';
      userData.activities = member.presence?.activities.map(a => ({
        name: a.name,
        type: a.type,
        details: a.details
      })) || [];
    }

    logAccess('DETAILED_USER_INFO', msg.author.id, { targetUser: user.username, targetId: user.id }, 'MEDIUM');
    exportUserData(userData, `user_${user.id}_data.json`);

    const embed = new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('⚠️ User Information Exposed')
      .setThumbnail(user.displayAvatarURL())
      .addField('Username', user.username, true)
      .addField('User ID', `\`${user.id}\``, true)
      .addField('Discriminator', user.discriminator || 'N/A', true)
      .addField('Account Created', user.createdAt.toDateString(), true)
      .addField('Bot Account', user.bot ? 'Yes' : 'No', true);

    if (member) {
      embed.addField('Joined Server', member.joinedAt.toDateString(), true)
        .addField('Nickname', member.nickname || 'None', true)
        .addField('Status', member.presence?.status || 'offline', true)
        .addField('Roles', member.roles.cache.map(r => r.name).join(', ') || 'None', false);
      
      if (member.presence?.activities.length > 0) {
        embed.addField('Current Activities', 
          member.presence.activities.map(a => `${a.name} (${a.type})`).join('\n'), false);
      }
    }

    embed.setFooter('Educational Demo - Data Exposure Vulnerability');
    msg.channel.send({ embeds: [embed] });
    msg.channel.send(`📁 Full data exported to: \`user_${user.id}_data.json\``);
  }

  if (msg.content.startsWith('!track')) {
    const user = msg.mentions.users.first();
    if (!user) {
      return msg.reply('Please mention a user! Usage: !track @username');
    }

    const member = msg.guild.members.cache.get(user.id);
    if (!member) {
      return msg.reply('User not found in this server.');
    }

    const trackingData = {
      userId: user.id,
      username: user.username,
      timestamp: moment().format(),
      status: member.presence?.status || 'offline',
      activities: member.presence?.activities || [],
      roles: member.roles.cache.map(r => r.name),
      joinedServer: member.joinedAt.toISOString(),
      accountAge: moment().diff(user.createdAt, 'days')
    };

    logAccess('USER_TRACKING', msg.author.id, { targetUser: user.username }, 'MEDIUM');
    
    const trackingLog = `./data/tracking_${user.id}.json`;
    let existingData = [];
    if (fs.existsSync(trackingLog)) {
      existingData = fs.readJsonSync(trackingLog);
    }
    existingData.push(trackingData);
    fs.writeJsonSync(trackingLog, existingData, { spaces: 2 });

    msg.reply(`✅ Tracking data recorded for ${user.username}. Total records: ${existingData.length}`);
  }

  if (msg.content.startsWith('!stalk')) {
    const user = msg.mentions.users.first();
    if (!user) {
      return msg.reply('Please mention a user! Usage: !stalk @username');
    }

    const member = msg.guild.members.cache.get(user.id);
    
    const embed = new Discord.MessageEmbed()
      .setColor('#8b0000')
      .setTitle('🔍 Advanced Profile Analysis')
      .setThumbnail(user.displayAvatarURL())
      .addField('Target User', `${user.username}#${user.discriminator}`)
      .addField('User ID', `\`${user.id}\``, true)
      .addField('Account Age', `${moment().diff(user.createdAt, 'days')} days`, true);

    if (member) {
      embed.addField('Server Join Date', member.joinedAt.toDateString(), true)
        .addField('Days in Server', `${moment().diff(member.joinedAt, 'days')} days`, true)
        .addField('Total Roles', `${member.roles.cache.size}`, true)
        .addField('Highest Role', member.roles.highest.name, true)
        .addField('Permissions', member.permissions.toArray().slice(0, 5).join(', ') + '...', false);
    }

    embed.addField('Avatar URL', user.displayAvatarURL({ dynamic: true, size: 512 }), false)
      .setFooter('⚠️ This is a privacy violation demonstration');

    logAccess('STALKER_PROFILE', msg.author.id, { targetUser: user.username }, 'HIGH');
    msg.channel.send({ embeds: [embed] });
  }

  if (msg.content === '!export') {
    try {
      msg.reply('🔄 Exporting all server data... This may take a moment.');
      
      const members = await msg.guild.members.fetch();
      const channels = msg.guild.channels.cache;
      const roles = msg.guild.roles.cache;

      const serverData = {
        exportDate: moment().format(),
        server: {
          id: msg.guild.id,
          name: msg.guild.name,
          memberCount: msg.guild.memberCount,
          createdAt: msg.guild.createdAt.toISOString(),
          ownerId: msg.guild.ownerId
        },
        members: members.map(m => ({
          id: m.user.id,
          username: m.user.username,
          discriminator: m.user.discriminator,
          isBot: m.user.bot,
          joinedAt: m.joinedAt.toISOString(),
          roles: m.roles.cache.map(r => r.name),
          status: m.presence?.status || 'offline'
        })),
        channels: channels.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type
        })),
        roles: roles.map(r => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          position: r.position,
          permissions: r.permissions.toArray()
        }))
      };

      exportUserData(serverData, `FULL_SERVER_EXPORT_${msg.guild.id}.json`);
      logAccess('FULL_SERVER_EXPORT', msg.author.id, { serverName: msg.guild.name }, 'CRITICAL');

      msg.channel.send(`✅ Full server data exported!\n📁 File: \`FULL_SERVER_EXPORT_${msg.guild.id}.json\`\n👥 Members: ${members.size}\n📢 Channels: ${channels.size}\n🎭 Roles: ${roles.size}`);
    } catch (error) {
      msg.reply('Error exporting server data.');
      console.error(error);
    }
  }

  // === ADVANCED COMMANDS ===

  // !scrape [channel] [limit] - Scrape message history
//   if (msg.content.startsWith('!scrape')) {
//     const args = msg.content.split(' ');
//     const targetChannel = msg.mentions.channels.first() || msg.channel;
//     const limit = parseInt(args[2]) || 100;

//     if (limit > 500) {
//       return msg.reply('⚠️ Limit too high! Maximum 500 messages to prevent rate limiting.');
//     }

//     try {
//       msg.reply(`🔄 Scraping ${limit} messages from ${targetChannel.name}...`);
      
//       const messages = await targetChannel.messages.fetch({ limit: limit });
//       const scrapedData = [];

//       messages.forEach(m => {
//         scrapedData.push({
//           messageId: m.id,
//           author: {
//             id: m.author.id,
//             username: m.author.username,
//             bot: m.author.bot
//           },
//           content: m.content,
//           timestamp: m.createdAt.toISOString(),
//           attachments: m.attachments.map(a => ({ url: a.url, name: a.name })),
//           embeds: m.embeds.length,
//           reactions: m.reactions.cache.map(r => ({ emoji: r.emoji.name, count: r.count }))
//         });
//       });

//       const filename = `messages_${targetChannel.id}_${Date.now()}.json`;
//       exportUserData(scrapedData, `messages/${filename}`);
//       logAccess('MESSAGE_SCRAPE', msg.author.id, { channel: targetChannel.name, count: scrapedData.length }, 'CRITICAL');

//       msg.channel.send(`✅ Scraped ${scrapedData.length} messages!\n📁 Saved to: \`messages/${filename}\``);
//     } catch (error) {
//       msg.reply('Error scraping messages. Missing permissions?');
//       console.error(error);
//     }
//   }

  // !analyze @user - Analyze user's message patterns
  if (msg.content.startsWith('!analyze')) {
    const user = msg.mentions.users.first();
    if (!user) {
      return msg.reply('Please mention a user! Usage: !analyze @username');
    }

    let totalMessages = 0;
    let channelActivity = {};
    let messagesByHour = {};

    // Analyze from in-memory database
    Object.keys(messageDatabase).forEach(channelId => {
      messageDatabase[channelId].forEach(msgData => {
        if (msgData.author.id === user.id) {
          totalMessages++;
          
          // Count by channel
          const channel = msg.guild.channels.cache.get(channelId);
          if (channel) {
            channelActivity[channel.name] = (channelActivity[channel.name] || 0) + 1;
          }

          // Count by hour
          const hour = moment(msgData.timestamp).hour();
          messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
        }
      });
    });

    const mostActiveHours = Object.entries(messagesByHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => `${hour}:00 (${count} msgs)`)
      .join(', ');

    const topChannels = Object.entries(channelActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([channel, count]) => `${channel}: ${count}`)
      .join('\n');

    const embed = new Discord.MessageEmbed()
      .setColor('#9b59b6')
      .setTitle('📊 Message Pattern Analysis')
      .setDescription(`Analysis for ${user.username}`)
      .addField('Total Messages Collected', `${totalMessages}`, true)
      .addField('Channels Tracked', `${Object.keys(channelActivity).length}`, true)
      .addField('Most Active Hours', mostActiveHours || 'N/A', false)
      .addField('Top Channels', topChannels || 'No data', false)
      .setFooter('Based on messages since bot started');

    logAccess('MESSAGE_ANALYSIS', msg.author.id, { targetUser: user.username, msgCount: totalMessages }, 'HIGH');
    msg.channel.send({ embeds: [embed] });
  }

  // !webhooks - List all webhooks in server
  if (msg.content === '!webhooks') {
    try {
      const webhooks = await msg.guild.fetchWebhooks();
      
      if (webhooks.size === 0) {
        return msg.reply('No webhooks found in this server.');
      }

      const webhookData = webhooks.map(wh => ({
        id: wh.id,
        name: wh.name,
        channelId: wh.channelId,
        token: wh.token ? '[REDACTED]' : 'No token',
        url: wh.url,
        owner: wh.owner?.username || 'Unknown'
      }));

      exportUserData(webhookData, `webhooks/webhooks_${msg.guild.id}.json`);

      const embed = new Discord.MessageEmbed()
        .setColor('#e74c3c')
        .setTitle('🔗 Server Webhooks Detected')
        .setDescription(`Found ${webhooks.size} webhook(s)`)
        .addField('⚠️ Security Risk', 'Webhooks can be abused for impersonation and spam', false);

      webhooks.forEach(wh => {
        const channel = msg.guild.channels.cache.get(wh.channelId);
        embed.addField(
          `${wh.name} (ID: ${wh.id})`,
          `Channel: ${channel?.name || 'Unknown'}\nOwner: ${wh.owner?.username || 'Unknown'}`,
          false
        );
      });

      logAccess('WEBHOOK_ENUMERATION', msg.author.id, { count: webhooks.size }, 'CRITICAL');
      msg.channel.send({ embeds: [embed] });
      msg.channel.send(`📁 Webhook data exported to: \`webhooks/webhooks_${msg.guild.id}.json\``);
    } catch (error) {
      msg.reply('Error fetching webhooks. Missing permissions?');
      console.error(error);
    }
  }

  // !invites - Analyze server invites
  if (msg.content === '!invites') {
    try {
      const invites = await msg.guild.invites.fetch();
      
      if (invites.size === 0) {
        return msg.reply('No active invites found.');
      }

      const inviteData = invites.map(inv => ({
        code: inv.code,
        inviter: inv.inviter?.username || 'Unknown',
        uses: inv.uses,
        maxUses: inv.maxUses,
        channel: inv.channel?.name,
        expiresAt: inv.expiresAt?.toISOString() || 'Never',
        createdAt: inv.createdAt.toISOString()
      }));

      exportUserData(inviteData, `invites_${msg.guild.id}.json`);

      const embed = new Discord.MessageEmbed()
        .setColor('#3498db')
        .setTitle('🎫 Server Invite Analysis')
        .setDescription(`Found ${invites.size} active invite(s)`);

      invites.forEach(inv => {
        embed.addField(
          `Code: ${inv.code}`,
          `Inviter: ${inv.inviter?.username || 'Unknown'}\nUses: ${inv.uses}/${inv.maxUses || '∞'}\nChannel: ${inv.channel?.name}`,
          true
        );
      });

      logAccess('INVITE_ENUMERATION', msg.author.id, { count: invites.size }, 'HIGH');
      msg.channel.send({ embeds: [embed] });
    } catch (error) {
      msg.reply('Error fetching invites. Missing permissions?');
      console.error(error);
    }
  }

  // !permissions @user - Analyze user permissions
  if (msg.content.startsWith('!permissions')) {
    const user = msg.mentions.users.first();
    if (!user) {
      return msg.reply('Please mention a user! Usage: !permissions @username');
    }

    const member = msg.guild.members.cache.get(user.id);
    if (!member) {
      return msg.reply('User not found in this server.');
    }

    const permissions = member.permissions.toArray();
    const dangerousPerms = permissions.filter(p => 
      ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 
       'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_WEBHOOKS'].includes(p)
    );

    const embed = new Discord.MessageEmbed()
      .setColor(dangerousPerms.length > 0 ? '#e74c3c' : '#2ecc71')
      .setTitle('🔐 Permission Analysis')
      .setDescription(`Analyzing ${user.username}`)
      .addField('Total Permissions', `${permissions.length}`, true)
      .addField('Dangerous Permissions', `${dangerousPerms.length}`, true)
      .addField('Is Administrator', member.permissions.has('ADMINISTRATOR') ? '⚠️ YES' : '✅ No', true)
      .addField('All Permissions', permissions.join(', '), false);

    if (dangerousPerms.length > 0) {
      embed.addField('⚠️ Dangerous Perms', dangerousPerms.join(', '), false);
    }

    logAccess('PERMISSION_ANALYSIS', msg.author.id, { targetUser: user.username, dangerousPerms: dangerousPerms.length }, 'MEDIUM');
    msg.channel.send({ embeds: [embed] });
  }

  // !correlation - Cross-reference collected data
  if (msg.content === '!correlation') {
    try {
      msg.reply('🔄 Analyzing collected data for patterns...');

      const members = await msg.guild.members.fetch();
      const analysis = {
        totalMembers: members.size,
        bots: members.filter(m => m.user.bot).size,
        humans: members.filter(m => !m.user.bot).size,
        onlineUsers: members.filter(m => m.presence?.status === 'online').size,
        roles: msg.guild.roles.cache.size,
        channels: msg.guild.channels.cache.size,
        trackingFiles: fs.readdirSync('./data').filter(f => f.startsWith('tracking_')).length,
        messageCollectionSize: Object.keys(messageDatabase).length,
        totalMessagesTracked: Object.values(messageDatabase).reduce((sum, msgs) => sum + msgs.length, 0)
      };

      const embed = new Discord.MessageEmbed()
        .setColor('#9b59b6')
        .setTitle('🔗 Data Correlation Analysis')
        .addField('Server Stats', `Members: ${analysis.totalMembers}\nBots: ${analysis.bots}\nHumans: ${analysis.humans}\nOnline: ${analysis.onlineUsers}`, true)
        .addField('Infrastructure', `Roles: ${analysis.roles}\nChannels: ${analysis.channels}`, true)
        .addField('Collected Intelligence', `Tracking Files: ${analysis.trackingFiles}\nChannels Monitored: ${analysis.messageCollectionSize}\nMessages Logged: ${analysis.totalMessagesTracked}`, false)
        .setFooter('This demonstrates data correlation capabilities');

      exportUserData(analysis, `correlation_${Date.now()}.json`);
      logAccess('DATA_CORRELATION', msg.author.id, analysis, 'CRITICAL');

      msg.channel.send({ embeds: [embed] });
    } catch (error) {
      msg.reply('Error performing correlation analysis.');
      console.error(error);
    }
  }

  if (msg.content === '!logs') {
    try {
      const logs = fs.readFileSync('./logs/access.log', 'utf8');
      const recentLogs = logs.split('\n').slice(-20).join('\n');
      
      msg.channel.send(`\`\`\`\n${recentLogs || 'No logs yet'}\n\`\`\``);
    } catch (error) {
      msg.reply('No logs found yet.');
    }
  }

  // !criticallogs - View critical security events
  if (msg.content === '!criticallogs') {
    try {
      if (!fs.existsSync('./logs/critical.log')) {
        return msg.reply('No critical events logged yet.');
      }
      
      const logs = fs.readFileSync('./logs/critical.log', 'utf8');
      const recentLogs = logs.split('\n').slice(-15).join('\n');
      
      msg.channel.send(`**⚠️ CRITICAL SECURITY EVENTS:**\`\`\`\n${recentLogs}\n\`\`\``);
    } catch (error) {
      msg.reply('Error reading critical logs.');
    }
  }

//   if (msg.content === '!help') {
//     const helpEmbed = new Discord.MessageEmbed()
//       .setColor('#ffa500')
//       .setTitle('🔓 Advanced Security Research Bot')
//       .setDescription('⚠️ **Educational Cybersecurity Demonstration**\n\n**BASIC COMMANDS:**')
//       .addField('!myid', 'Show your Discord user ID')
//       .addField('!userid @user', 'Show mentioned user\'s ID')
//       .addField('!serverids', 'List ALL server members with IDs')
//       .addField('!userinfo [@user]', 'Detailed user information + export')
//       .addField('!track @user', 'Track user activity over time')
//       .addField('!stalker @user', 'Advanced profile analysis')
//       .addField('!export', 'Export complete server data')
//       .setFooter('Use !help2 for advanced commands');

//     msg.reply({ embeds: [helpEmbed] });
//   }

//   if (msg.content === '!help2') {
//     const helpEmbed = new Discord.MessageEmbed()
//       .setColor('#e74c3c')
//       .setTitle('🔓 Advanced Security Research Bot')
//       .setDescription('⚠️ **ADVANCED COMMANDS:**')
//       .addField('!scrape [#channel] [limit]', 'Scrape message history (max 500)')
//       .addField('!analyze @user', 'Analyze user message patterns')
//       .addField('!webhooks', 'List all server webhooks')
//       .addField('!invites', 'Analyze server invites')
//       .addField('!permissions @user', 'Analyze user permissions')
//       .addField('!correlation', 'Cross-reference all collected data')
//       .addField('!logs', 'View recent access logs')
//       .addField('!criticallogs', 'View critical security events')
//       .setFooter('All actions are logged | Data exported to /data folder');

//     msg.reply({ embeds: [helpEmbed] });
//   }
});

client.login(process.env.DIS_TOKEN);