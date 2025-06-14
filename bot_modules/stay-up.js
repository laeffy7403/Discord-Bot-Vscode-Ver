require('dotenv').config();
const Discord = require("discord.js")
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
});


client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignore bot messages
    
    if (message.content.toLowerCase() === '-uptime') {
        // Get uptime in milliseconds
        const uptime = process.uptime() * 1000;
        
        // Calculate time units
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        
        // Format the uptime string
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;
        
        // Create embed
        const { MessageEmbed } = require('discord.js');
        const embed = new MessageEmbed()
            .setColor('#228C22') // dark green color
            .setTitle('Bot Uptime 🟢')
            .setDescription(`been online for: **${uptimeString}**`)
            .setTimestamp()
            .setFooter({ text: 'Bot Status' });
        
        message.reply({ embeds: [embed] });
    }
});


const UP_TIME_1 = 10; 
// const UP_TIME_2 = 10;
const BR = '----------------------------------------';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag} ${UP_TIME_1} min counter up`);
  const channelId = '1380085584394981428';
  const interval = UP_TIME_1 * 60 * 1000; // 10 minutes in milliseconds
  var i = 0;
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      i++;
      channel.send(`${BR} stay up every ${UP_TIME_1} min count: **${i}** 😤`);
      // channel.send(`monika wes -`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

//Pinging alt-bot every 30 seconds 
client.once('ready', () => {
  console.log(`✅Logged in as ${client.user.tag}, 30sec pinging up`);
  const channelId = '1380085584394981428'; 
  const interval = 30 * 1000; // 30 sec in milliseconds

  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(`<@970610501589544991>`);
      channel.send(`<@998495427026493501>`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

// client.once('ready', () => {
//   console.log(`✅Logged in as ${client.user.tag}, 10 min up`);
//   const channelId = '1380085584394981428'; // change this
//   const interval = 10 * 60 * 1000; // 10 minutes in milliseconds
//   var i = 0;
//   var br = '----------------------------------------';
  
//   setInterval(() => {
//     const channel = client.channels.cache.get(channelId);
//     if (channel) {
//       i++;
//       channel.send(`${BR}monika - 10min counter: **${i}** `);
//       channel.send(`monika wes -`);
//     } else {
//       console.log('Channel not found.');
//     }
//   }, interval);
// });



// client.on("messageCreate", message => {
//   // Only respond in the specific channel
//   if (message.channel.id !== '1380085584394981428') return;
  
//   const msgContent = message.content.toLowerCase();
//   var signal = ["wes", "monika", "m", "o", "n", "i", "k", "a", "w", "e", "s", "-"];
  
//   if (signal.some(trigger => msgContent.includes(trigger))) {
//     message.channel.send("monika monika monika monika monika monika!");
//   }
// });


client.login(process.env.DIS_TOKEN);