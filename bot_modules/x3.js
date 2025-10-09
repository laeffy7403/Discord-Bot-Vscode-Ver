require("dotenv").config();
const { Intents } = require("discord.js");
const Discord = require("discord.js");
// const fs = require("fs-extra");
// const moment = require("moment");
// const axios = require("axios");

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.MESSAGE_CONTENT, Discord.Intents.FLAGS.GUILD_MEMBERS]
});


// When the client is ready
client.once('ready', c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log('Bot is exposing user IDs for educational purposes');
});


// Message create event
client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  // Command: !myid - Shows the user's own ID
  if (msg.content === '!myid') {
    msg.reply(`Your Discord User ID is: \`${msg.author.id}\``);
  }

  // Command: !userid @user - Shows mentioned user's ID
  if (msg.content.startsWith('!userid')) {
    if (msg.mentions.users.size > 0) {
      const user = msg.mentions.users.first();
      msg.reply(`User ID of ${user.username}: \`${user.id}\``);
    } else {
      msg.reply('Please mention a user! Usage: !userid @username');
    }
  }

  // Command: !serverids - Lists all members and their IDs (PRIVACY RISK)
  if (msg.content === '!serverids') {
    try {
      const members = await msg.guild.members.fetch();
      let userList = '**Server Member IDs (Exposed):**\n\n';
      
      members.forEach(member => {
        userList += `${member.user.username}: \`${member.user.id}\`\n`;
      });

      // Split into chunks if too long
      if (userList.length > 2000) {
        const chunks = userList.match(/[\s\S]{1,1900}/g);
        chunks.forEach(chunk => msg.channel.send(chunk));
      } else {
        msg.channel.send(userList);
      }
    } catch (error) {
      msg.reply('Error fetching server members.');
      console.error(error);
    }
  }

  // Command: !userinfo @user - Detailed info exposure
  if (msg.content.startsWith('!userinfo')) {
    const user = msg.mentions.users.first() || msg.author;
    const member = msg.guild.members.cache.get(user.id);

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
        .addField('Roles', member.roles.cache.map(r => r.name).join(', ') || 'None', false);
    }

    embed.setFooter('Educational Demo - Data Exposure Vulnerability');

    msg.channel.send({ embeds: [embed] });
  }

  // Command: !help - Show available commands
//   if (msg.content === '!help') {
//     const helpEmbed = new Discord.EmbedBuilder()
//       .setColor('#ffa500')
//       .setTitle('Discord ID Exposure Bot - Commands')
//       .setDescription('⚠️ **Educational Cybersecurity Demo**')
//       .addFields(
//         { name: '!myid', value: 'Shows your Discord user ID' },
//         { name: '!userid @user', value: 'Shows the mentioned user\'s ID' },
//         { name: '!serverids', value: 'Lists ALL server members with IDs (Privacy Risk!)' },
//         { name: '!userinfo [@user]', value: 'Shows detailed information about a user' },
//         { name: '!help', value: 'Shows this help message' }
//       )
//       .setFooter({ text: 'This bot demonstrates data exposure vulnerabilities' });

//     msg.reply({ embeds: [helpEmbed] });
//   }
});

// Login to Discord
client.login(process.env.DIS_TOKEN);