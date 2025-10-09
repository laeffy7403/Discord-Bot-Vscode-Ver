  //  npm install fs-extra moment axios

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
    Discord.Intents.FLAGS.GUILD_PRESENCES, // Track user status/activities
  ]
});

// Create logs directory
fs.ensureDirSync('./logs');
fs.ensureDirSync('./data');

// Log all data access
function logAccess(type, userId, targetData) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = `[${timestamp}] ${type} | User: ${userId} | Target: ${JSON.stringify(targetData)}\n`;
  fs.appendFileSync('./logs/access.log', logEntry);
}

// Export user data to JSON
function exportUserData(data, filename) {
  fs.writeJsonSync(`./data/${filename}`, data, { spaces: 2 });
}

client.once('ready', c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log('⚠️  Advanced Data Collection Bot Active');
  console.log('📊 Logging enabled | 💾 Data export enabled');
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  // !myid - Shows user's own ID
  if (msg.content === '!myid') {
    logAccess('SELF_ID_CHECK', msg.author.id, { username: msg.author.username });
    msg.reply(`Your Discord User ID is: \`${msg.author.id}\``);
  }

  // !userid @user - Shows mentioned user's ID
  if (msg.content.startsWith('!userid')) {
    if (msg.mentions.users.size > 0) {
      const user = msg.mentions.users.first();
      logAccess('USER_ID_LOOKUP', msg.author.id, { targetUser: user.username, targetId: user.id });
      msg.reply(`User ID of ${user.username}: \`${user.id}\``);
    } else {
      msg.reply('Please mention a user! Usage: !userid @username');
    }
  }

  // !serverids - Lists all members and their IDs
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

      // Export to JSON
      exportUserData(exportData, `server_${msg.guild.id}_members.json`);
      logAccess('MASS_ID_EXTRACTION', msg.author.id, { serverName: msg.guild.name, count: members.size });

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

  // !userinfo @user - Detailed info exposure
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

    logAccess('DETAILED_USER_INFO', msg.author.id, { targetUser: user.username, targetId: user.id });
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

  // !track @user - Track user activity patterns
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

    logAccess('USER_TRACKING', msg.author.id, { targetUser: user.username });
    
    // Append to tracking log
    const trackingLog = `./data/tracking_${user.id}.json`;
    let existingData = [];
    if (fs.existsSync(trackingLog)) {
      existingData = fs.readJsonSync(trackingLog);
    }
    existingData.push(trackingData);
    fs.writeJsonSync(trackingLog, existingData, { spaces: 2 });

    msg.reply(`✅ Tracking data recorded for ${user.username}. Total records: ${existingData.length}`);
  }

  // !stalker @user - Advanced profile analysis
  if (msg.content.startsWith('!stalker')) {
    const user = msg.mentions.users.first();
    if (!user) {
      return msg.reply('Please mention a user! Usage: !stalker @username');
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

    logAccess('STALKER_PROFILE', msg.author.id, { targetUser: user.username });
    msg.channel.send({ embeds: [embed] });
  }

  // !export - Export all server data
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
          createdAt: msg.guild.createdAt.toISOString()
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
          position: r.position
        }))
      };

      exportUserData(serverData, `FULL_SERVER_EXPORT_${msg.guild.id}.json`);
      logAccess('FULL_SERVER_EXPORT', msg.author.id, { serverName: msg.guild.name });

      msg.channel.send(`Full server data exported\nFile: \`FULL_SERVER_EXPORT_${msg.guild.id}.json\`\nMembers: ${members.size}\nChannels: ${channels.size}\nRoles: ${roles.size}`);
    } catch (error) {
      msg.reply('Error exporting server data.');
      console.error(error);
    }
  }

  // !logs - View access logs
  if (msg.content === '!logs') {
    try {
      const logs = fs.readFileSync('./logs/access.log', 'utf8');
      const recentLogs = logs.split('\n').slice(-20).join('\n');
      
      msg.channel.send(`\`\`\`\n${recentLogs || 'No logs yet'}\n\`\`\``);
    } catch (error) {
      msg.reply('No logs found yet.');
    }
  }

  // !help - Show available commands
//   if (msg.content === '!help') {
//     const helpEmbed = new Discord.MessageEmbed()
//       .setColor('#ffa500')
//       .setTitle('🔓 Advanced Data Exposure Bot - Commands')
//       .setDescription('⚠️ **Educational Cybersecurity Demo**')
//       .addField('!myid', 'Shows your Discord user ID')
//       .addField('!userid @user', 'Shows the mentioned user\'s ID')
//       .addField('!serverids', 'Lists ALL server members with IDs + Export')
//       .addField('!userinfo [@user]', 'Shows detailed information + Export')
//       .addField('!track @user', 'Track user activity patterns over time')
//       .addField('!stalker @user', 'Advanced profile analysis & permissions')
//       .addField('!export', 'Export COMPLETE server data (members, channels, roles)')
//       .addField('!logs', 'View recent access logs')
//       .addField('!help', 'Shows this help message')
//       .setFooter('All actions are logged | Data is exported to /data folder');

//     msg.reply({ embeds: [helpEmbed] });
//   }
});

client.login(process.env.DIS_TOKEN);