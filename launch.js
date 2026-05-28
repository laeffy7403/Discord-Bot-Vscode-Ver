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
require('./bot_modules/m_word_trigger.js');
require('./bot_modules/f_ai_bot.js');
require('./bot_modules/m_photo_tracker.js');
require('./bot_modules/m_stay_up.js');
require('./bot_modules/f_info_retrieve.js');
require('./bot_modules/f_music.js');

require('./additional_modules/caller1.js');
require('./additional_modules/caller2.js');
require('./additional_modules/caller3.js');


//EXPERIMENTING NEW FEATURE SECTION 
client.on("messageCreate", message => {
  if (message.author.bot) return;


  const msgContent = message.content.toLowerCase();
  const botMsg = `\n\n**(I am a bot, and this action was performed automatically. Please contact ${creator.tag} the moderators of this sub if you have any questions or concerns.)**`;

      // Check for help command
    var manualToggle = "**# Keyword Control Toggle Commands**[Requires server access]\n"+
    "`-ton` - Enables keyword control to block messages containing specific sensitive words.(shut down)\n"+
    "`-toff` - Disables keyword control, allowing all words to trigger normally.\n"+
    "`-tstat` - Displays the current keyword control status for the server."+
    "\n\n**Note:** Moderators should use this feature responsibly. When users send sensitive or offensive words (e.g., “wtf”, “dick”), the bot will automatically respond with a care message to help maintain a positive environment.\n"; 
    
    var manualAI = "\n\n**# AI Commands** [Always available — not affected by keyword control]\n"+
    "`@wes {your message}` - Chat directly with the AI.\n"+
    "`ai--clearmemo` - Clears your AI chat memory.\n"+
    "`ai--memostat` - Displays your conversation statistics.\n"+
    "\n**Note:** The AI uses data from 2021–2022, so some information may be outdated. Long messages may take a while to process due to response latency.\n";
    
    var manualPhoto = "\n\n**# Photo Tracker Commands** [Always available — not affected by keyword control]\n"+
    "`-mystat` - View your photo upload statistics.\n"+
    "`-photostat @user` - View photo statistics for a specific user.\n"+
    "`-toposter` - View the top photo contributors leaderboard.\n"+
    "`-serverstat` - View overall server photo statistics.\n"+
    "`-channelstat` - View photo statistics for current channel.\n"+
    "\n**Note:** Bot automatically tracks image uploads in the channel, condition is the bot must stay online \n"

    var manualMusic = "\n\n**# Music Commands** [Requires being in a voice channel]\n"+
    "`-play <song/url>` - Play from YouTube, Spotify, or SoundCloud.\n"+
    "`-skip` - Skip current song.\n"+
    "`-stop` - Stop playing and clear queue.\n"+
    "`-pause` - Pause current song.\n"+
    "`-resume` - Resume paused song.\n"+
    "`-queue` - Show current queue.\n"+
    "`-nowplaying` - Show current song info.\n"+
    "`-volume <0-100>` - Set volume.\n"+
    "`-ask <question>` - Ask AI assistant anything.\n"+
    "\n**Supported Sources:** SoundCloud (Track URLs)\n"

    var manualGeneral = "\n\n# (disabled)General Commands [Always available — not affected by keyword control]\n"+
    "`-uptime` - Check how long the bot has been online.\n"

    var updateLog = "\n\n**Update Log**\n"+
     "`v1.3.0` - Added music functionality. (only works for soundclound music)\n"+
     "`v1.2.0` - Introduced memory management commands for AI and enhanced keyword control.\n"+
     "`v1.1.0` - Added uptime command and improved photo tracking features.\n"+
    "`v1.0.0` - Initial release with basic AI chat, keyword control, and photo tracking.\n"+
    "- **Per-user storage** - Each user has their own conversation history\n"+
    "- **Automatic cleanup** - Limits to last 30 messages per user"

 
      if (msgContent.includes("--help")) {  
      message.reply(manualToggle + manualAI + manualMusic + manualGeneral + botMsg);
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

client.login(process.env.DISCORD_BOT_TOKEN_1);
// client.login(process.env.DISCORD_BOT_TOKEN_2);
// const mySecret = process.env['DISCORD_BOT_TOKEN_1']
