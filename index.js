const express = require("express")
const app = express();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`wes is running on port ${PORT}!`);
})

app.get("/", (req, res) => {res.send("wes is running!");})

const Discord = require("discord.js")
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
});

// FETCH DISCORD USERNAME BY ID
// Declare up here for global access
let creator; 

client.once('ready', async () => {
  try {
    creator = await client.users.fetch("693111194319323197");
    console.log(`✅Logged in as ${client.user.tag} owned by ${creator.tag}, Main`);
  } catch (err) {
    console.error("Failed to fetch owner user:", err);
  }
});


// Import modules
require('./bot_modules/word-trigger.js');
require('./bot_modules/ai-bot.js');
require('./bot_modules/photo-tracker.js');
require('./bot_modules/stay-up.js');


//EXPERIMENTING NEW FEATURE SECTION 
client.on("messageCreate", message => {
  if (message.author.bot) return;


  const msgContent = message.content.toLowerCase();
  const botMsg = `\n\n**(I am a bot, and this action was performed automatically. Please contact ${creator.tag} the moderators of this sub if you have any questions or concerns.)**`;

      // Check for help command
    var manualToggle = "**# Keyword Control Toggle Commands**[need access from the server]\n"+
    "`-ton` - enable keyword control to prevent word triggering off with certain word.(shut down)\n"+
    "`-toff` - disable keyword control allow certain word to be trigger through texting in the chat.\n"+
    "`-tstat` - check the status of keyword contorl in the server."+
    "\n\n**Note:** Moderator respond with care msg to stop negative or bad mind spread among to people, when sensitive word like 'wtf' 'dick' and more. As the mod find it to be sentitive it will trigger the care msg.\n"; 
    
    var manualAI = "\n\n**# AI Commands** [not in the toggle scope can be call when keyword control is on]\n"+
    "`@wes {your message}` - Use this command to chat with AI.\n"+
    "`ai--clearmemo` - Clear your AI chat history.\n"+
    "`ai--memostat` - View your conversation statistics.\n"+
    "\n**Note:** The AI is using outdated data from 2022-2021, so it may not have the latest information. Beside long text msg might takes ahwile to respond due to latancy.\n";
    
    var manualPhoto = "\n\n**# Photo Tracker Commands** [not in the toggle scope can be call when keyword control is on]\n"+
    "`-mystat` - View your photo upload statistics.\n"+
    "`-photostat @user` - View photo statistics for a specific user.\n"+
    "`-toposter` - View the top photo contributors leaderboard.\n"+
    "`-serverstat` - View overall server photo statistics.\n"+
    "`-channelstat` - View photo statistics for current channel.\n"+
    "\n**Note:** Bot automatically tracks image uploads in the channel, condition is the bot must stay online \n"

    var manualGeneral = "\n\n# General Commands [not in the toggle scope can be call when keyword control is on]\n"+
    "`-uptime` - Check how long the bot has been online.\n"

    var updateLog = "\n\n**Update Log**\n"+
    "`v1.0.0` - Initial release with basic AI chat, keyword control, and photo tracking.\n"+
    "`v1.1.0` - Added uptime command and improved photo tracking features.\n"+
    "`v1.2.0` - Introduced memory management commands for AI and enhanced keyword control.\n"+
    "- **Per-user storage** - Each user has their own conversation history\n"+
    "- **Automatic cleanup** - Limits to last 20 messages per user"

 
      if (msgContent.includes("--help")) {
      message.reply(manualToggle + manualAI + manualPhoto + manualGeneral + botMsg);
    }

    if (msgContent === "!help" || msgContent === "/help") {
      message.reply(`Use `+`--help`+` to list available commands! ${botMsg}`);
    }

});




client.on("messageCreate", message => {
  if (message.author.bot) return;
//   const msgContent = message.content.toLowerCase();
//   const botMsg = "\n\n**(I am a bot, and this action was performed automatically. Please contact the moderators of this server if you have any questions or concerns.)**";
  
//   // Check for simple toggle commands
//   if (msgContent === "on") {
//     // Check if user has permission to manage messages
//     if (!message.member.permissions.has("MANAGE_MESSAGES")) {
//       message.reply("❌ You need 'Manage Messages' permission to control keyword triggering.");
//       return;
//     }
    
//     const guildId = message.guild.id;
//     keywordToggleStates.set(guildId, true);
//     message.reply("✅ Keyword triggering is now **enabled** for this server.");
//     return;
//   }
  
//   if (msgContent === "off") {
//     // Check if user has permission to manage messages
//     if (!message.member.permissions.has("MANAGE_MESSAGES")) {
//       message.reply("❌ You need 'Manage Messages' permission to control keyword triggering.");
//       return;
//     }
    
//     const guildId = message.guild.id;
//     keywordToggleStates.set(guildId, false);
//     message.reply("❌ Keyword triggering is now **disabled** for this server.");
//     return;
//   }
  
//   // Check status command
//   if (msgContent === "status") {
//     const guildId = message.guild.id;
//     const isEnabled = getKeywordToggleState(guildId);
//     const status = isEnabled ? "enabled" : "disabled";
//     const emoji = isEnabled ? "✅" : "❌";
//     message.reply(`${emoji} Keyword triggering is currently **${status}** for this server.`);
//     return;
//   }
//   // Only process keyword triggers if enabled for this guild
//   if (!getKeywordToggleState(message.guild.id)) {
//     // Still process other commands like "yes" even when keywords are disabled
//     if (message.content.toLowerCase() === "yes") {
//       message.channel.send("https://tenor.com/view/yes-giga-chad-chad-gif-23788137");
//     }
//     return;
//   }
});




//BOTTOM SECTION
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  // if (interaction.commandName === 'ping') {
  //   await interaction.reply('Pong!');
  //   await interaction.followUp('Pong again!');
  // }
});

client.login(process.env.DIS_TOKEN)
// clienta.login(process.env.DIS_TOKEN)
// clientb.login(process.env.DIS_TOKEN)
const mySecret = process.env['DIS_TOKEN']
