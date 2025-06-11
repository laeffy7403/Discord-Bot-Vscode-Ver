require('dotenv').config();
const Discord = require("discord.js")
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
});


// const client = new Client({
//   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
// });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channelId = '1380085584394981428'; // change this
  // const interval = 10 * 60 * 1000; // 10 minutes in milliseconds
  const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
//   const interval = 5* 1000; // 5 sec in milliseconds

  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send("Hello! I'm still alive, don't forget about me 😤");
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

client.login(process.env.DIS_TOKEN);
