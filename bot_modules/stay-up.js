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

  if (message.content === "-- monika --") {
    message.channel.send("receive signal from monika!");
  }

  const channelId = '1380085584394981428'; // change this
  // const interval = 10 * 60 * 1000; // 10 minutes in milliseconds
  // const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
  const interval = 10* 1000; // 5 sec in milliseconds
  var i = 0;

  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      i++;
      // channel.send(`stay up every 5 min count: ${i} 😤`);
      channel.send(`-- wes --`);
    } else {
      console.log('Channel not found.');
    }
  }, interval);
});

client.login(process.env.DIS_TOKEN);
