require('dotenv').config();
const Discord = require("discord.js")
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const channelId = '1380085584394981428'; // change this
  const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
  var i = 0;
  var br = '--------------------------------------------------------------';
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      i++;
      channel.send(`${br} stay up every 5 min count: **${i}** 😤`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const channelId = '1380085584394981428'; // change this
  const interval = 3 * 60 * 1000; // 3 minutes in milliseconds
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(`wes`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const channelId = '1380085584394981428'; // change this
  const interval = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(`monika`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});



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