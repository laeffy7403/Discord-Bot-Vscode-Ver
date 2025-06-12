require('dotenv').config();
const Discord = require("discord.js")
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
});


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag} 6 min up`);
  const channelId = '1380085584394981428'; // change this
  const interval = 10 * 60 * 1000; // 10 minutes in milliseconds
  var i = 0;
  var br = '--------------------------------------------------------------';
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      i++;
      channel.send(`${br} stay up every 10 min count: **${i}** 😤`);
      // channel.send(`monika wes -`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

client.once('ready', () => {
  console.log(`✅Logged in as ${client.user.tag}, 3 min up`);
  const channelId = '1380085584394981428'; // change this
  const interval = 30 * 1000; // 30 sec in milliseconds
  var i = 0;
  var br = '----------------------------------------';
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      i++;
      // channel.send(`${br} wes - 1min counter: **${i}** `);
      channel.send(`<@970610501589544991>`);
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
//       channel.send(`${br}monika - 10min counter: **${i}** `);
//       channel.send(`monika wes -`);
//     } else {
//       console.log('Channel not found.');
//     }
//   }, interval);
// });



client.on("messageCreate", message => {
  // Only respond in the specific channel
  if (message.channel.id !== '1380085584394981428') return;
  
  const msgContent = message.content.toLowerCase();
  var signal = ["wes", "monika", "m", "o", "n", "i", "k", "a", "w", "e", "s", "-"];
  
  if (signal.some(trigger => msgContent.includes(trigger))) {
    message.channel.send("monika monika monika monika monika monika!");
  }
});






client.login(process.env.DIS_TOKEN);