//AI SECTION
require("dotenv").config();
// const Discord = require("discord.js");
const { Intents } = require("discord.js");
const fetch = require("node-fetch");
const Discord = require("discord.js")

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.MESSAGE_CONTENT]
});

// Discord bot ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Message listener for AI responses
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Skip very short messages
  if (message.content.length < 3) return;

  // Only respond when bot is mentioned or in DMs
  if (!message.mentions.has(client.user) && message.guild) return;

  const userInput = message.content.replace(`<@${client.user.id}>`, '').trim();
  const userName = message.author.username;

  try {
    console.log("Sending request to deepseek OpenRouter..."); // Debug log

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "HTTP-Referer": "https://your-site.com", // Optional: your site URL
        "X-Title": "Discord Bot" // Optional: your app name
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528-qwen3-8b:free", // Note: use "gpt-4" or "gpt-4-turbo" "anthropic/claude-3-haiku" mistralai/devstral-small:free  deepseek/deepseek-r1:free
        messages: [
          { 
            role: "system", 
            content: `You are a helpful Discord bot. Respond to ${userName} in a casual, friendly way. Keep responses concise and natural for Discord chat.` 
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 0 // Adjust as needed
      })
    });
    
    // Exception handling
    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API error:", response.status, errText);
      return await message.reply("OpenRouter API is having issues 😓. Check your key or try again later.");
    }

    const data = await response.json();
    console.log("OpenRouter response:", data); // Debug log

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data);
      return await message.reply("AI gave me a weird response 🤔. Try again?");
    }

    let reply = data.choices[0].message.content.trim();

    if (reply.length > 0) {
      // Handle Discord's 2000 character limit
      if (reply.length > 3000) {
        // Split into chunks for long responses
        const chunks = [];
        for (let i = 0; i < reply.length; i += 3000) {
          chunks.push(reply.substring(i, i + 3000));
        }
        
        await message.reply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await message.channel.send(chunks[i]);
        }
      } else {
        await message.reply(reply);
      }
    } else {
      await message.reply("Hmm, ask proper question dumbass 🤖");
    }
    
  } catch (error) {
    console.error("Error calling deepseek:", error.message);
    await message.reply("Something went wrong with Claude 🤖⚠️");
  }
});
// Login to Discord
client.login(process.env.DIS_TOKEN);