require("dotenv").config();
const { Client, Intents, MessageEmbed } = require("discord.js");
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");
const play = require("play-dl");
const spotify = require("spotify-url-info");
const scdl = require("soundcloud-downloader").default;
const fetch = require("node-fetch");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

// Music queue system (per server)
const queues = new Map();

class MusicQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.songs = [];
    this.currentSong = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.isPlaying = false;
    this.volume = 0.5;
    
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });
    
    this.player.on("error", (error) => {
      console.error("Audio player error:", error);
      this.playNext();
    });
  }
  
  async play(textChannel) {
    if (this.songs.length === 0) {
      this.isPlaying = false;
      textChannel.send("🎵 Queue is empty. Add more songs!");
      return;
    }
    
    this.currentSong = this.songs.shift();
    this.isPlaying = true;
    
    try {
      let resource;
      
      // Handle different sources
      if (this.currentSong.source === "youtube") {
        const stream = await play.stream(this.currentSong.url);
        
        resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        });
      } else if (this.currentSong.source === "soundcloud") {
        const stream = await scdl.download(this.currentSong.url);
        
        resource = createAudioResource(stream, {
          inlineVolume: true,
        });
      }
      
      resource.volume.setVolume(this.volume);
      this.player.play(resource);
      
      const sourceEmoji = {
        youtube: "📺",
        soundcloud: "🔊",
        spotify: "🎵"
      };
      
      const embed = new MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`${sourceEmoji[this.currentSong.source]} Now Playing`)
        .setDescription(`**${this.currentSong.title}**`)
        .addFields(
          { name: "Duration", value: this.currentSong.duration, inline: true },
          { name: "Source", value: this.currentSong.source.toUpperCase(), inline: true },
          { name: "Requested by", value: this.currentSong.requester, inline: true }
        )
        .setThumbnail(this.currentSong.thumbnail)
        .setFooter({ text: `${this.songs.length} song(s) in queue` });
      
      textChannel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error playing song:", error);
      textChannel.send("❌ Error playing this song. Skipping...");
      this.playNext();
    }
  }
  
  playNext() {
    if (this.songs.length > 0) {
      this.play(this.textChannel);
    } else {
      this.isPlaying = false;
      this.currentSong = null;
    }
  }
  
  skip() {
    this.player.stop();
  }
  
  pause() {
    this.player.pause();
  }
  
  resume() {
    this.player.unpause();
  }
  
  stop() {
    this.songs = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.player.stop();
  }
  
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "Unknown";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Detect source from URL
function detectSource(query) {
  if (query.includes("youtube.com") || query.includes("youtu.be")) {
    return "youtube";
  }
  if (query.includes("spotify.com")) {
    return "spotify";
  }
  if (query.includes("soundcloud.com")) {
    return "soundcloud";
  }
  return "search"; // Default to YouTube search
}

// Get song info from Spotify
async function getSpotifyInfo(url) {
  try {
    const { getData } = spotify(fetch);
    const data = await getData(url);
    
    // Check if it's a track or playlist
    if (data.type === "track") {
      return [{
        title: `${data.name} - ${data.artists.map(a => a.name).join(", ")}`,
        artist: data.artists.map(a => a.name).join(", "),
        duration: formatDuration(Math.floor(data.duration_ms / 1000)),
        thumbnail: data.album?.images?.[0]?.url || data.coverArt?.sources?.[0]?.url,
        searchQuery: `${data.name} ${data.artists.map(a => a.name).join(" ")}`,
      }];
    } else if (data.type === "playlist" || data.type === "album") {
      return data.tracks.items.map(item => {
        const track = item.track || item;
        return {
          title: `${track.name} - ${track.artists.map(a => a.name).join(", ")}`,
          artist: track.artists.map(a => a.name).join(", "),
          duration: formatDuration(Math.floor(track.duration_ms / 1000)),
          thumbnail: track.album?.images?.[0]?.url || data.images?.[0]?.url,
          searchQuery: `${track.name} ${track.artists.map(a => a.name).join(" ")}`,
        };
      });
    }
  } catch (error) {
    console.error("Spotify error:", error);
    throw new Error("Failed to fetch Spotify data");
  }
}

// Get YouTube URL from search query
async function getYouTubeUrl(searchQuery) {
  const searchResults = await play.search(searchQuery, { limit: 1 });
  if (!searchResults.length) {
    throw new Error("No results found");
  }
  return searchResults[0].url;
}

// Bot ready
client.once("ready", () => {
  console.log(`✅ Music Bot Online: ${client.user.tag}`);
});

// Command handler
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // ========== MUSIC COMMANDS ==========
  
  if (command === "play" || command === "p") {
    if (!message.member.voice.channel) {
      return message.reply("❌ You need to be in a voice channel!");
    }
    
    if (!args.length) {
      return message.reply("❌ Please provide a song name or URL!");
    }
    
    const query = args.join(" ");
    const source = detectSource(query);
    
    try {
      const searchMsg = await message.channel.send(`🔍 Searching for: **${query}**...`);
      
      let songsToAdd = [];
      
      // Handle Spotify
      if (source === "spotify") {
        const spotifyTracks = await getSpotifyInfo(query);
        
        for (const track of spotifyTracks) {
          try {
            const ytUrl = await getYouTubeUrl(track.searchQuery);
            const videoInfo = await play.video_info(ytUrl);
            
            songsToAdd.push({
              title: track.title,
              url: ytUrl,
              duration: track.duration,
              thumbnail: track.thumbnail,
              requester: message.author.username,
              source: "youtube",
            });
          } catch (err) {
            console.error(`Failed to find: ${track.title}`);
          }
        }
        
        if (songsToAdd.length === 0) {
          return message.reply("❌ Couldn't find any songs from Spotify link!");
        }
        
        searchMsg.edit(`✅ Found ${songsToAdd.length} song(s) from Spotify!`);
      }
      // Handle SoundCloud
      else if (source === "soundcloud") {
        const info = await scdl.getInfo(query);
        
        songsToAdd.push({
          title: info.title,
          url: query,
          duration: formatDuration(Math.floor(info.duration / 1000)),
          thumbnail: info.artwork_url || info.user.avatar_url,
          requester: message.author.username,
          source: "soundcloud",
        });
        
        searchMsg.delete();
      }
      // Handle YouTube (URL or search)
      else {
        let videoInfo;
        
        if (play.yt_validate(query) === "video") {
          videoInfo = await play.video_info(query);
        } else {
          const searchResults = await play.search(query, { limit: 1 });
          if (!searchResults.length) {
            throw new Error("No results found");
          }
          videoInfo = await play.video_info(searchResults[0].url);
        }
        
        const durationSeconds = videoInfo.video_details.durationInSec;
        
        songsToAdd.push({
          title: videoInfo.video_details.title,
          url: videoInfo.video_details.url,
          duration: formatDuration(durationSeconds),
          thumbnail: videoInfo.video_details.thumbnails[0].url,
          requester: message.author.username,
          source: "youtube",
        });
        
        searchMsg.delete();
      }
      
      // Get or create queue
      let queue = queues.get(message.guild.id);
      
      if (!queue) {
        queue = new MusicQueue(message.guild.id);
        queues.set(message.guild.id, queue);
        
        const connection = joinVoiceChannel({
          channelId: message.member.voice.channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });
        
        queue.connection = connection;
        queue.textChannel = message.channel;
        connection.subscribe(queue.player);
        
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      }
      
      // Add songs to queue
      queue.songs.push(...songsToAdd);
      
      if (!queue.isPlaying) {
        queue.play(message.channel);
      } else {
        if (songsToAdd.length === 1) {
          const song = songsToAdd[0];
          const embed = new MessageEmbed()
            .setColor("#00FF00")
            .setTitle("✅ Added to Queue")
            .setDescription(`**${song.title}**`)
            .addFields(
              { name: "Duration", value: song.duration, inline: true },
              { name: "Position", value: `#${queue.songs.length}`, inline: true },
              { name: "Source", value: song.source.toUpperCase(), inline: true }
            )
            .setThumbnail(song.thumbnail);
          
          message.channel.send({ embeds: [embed] });
        } else {
          message.channel.send(`✅ Added **${songsToAdd.length}** songs to queue!`);
        }
      }
      
    } catch (error) {
      console.error("Play error:", error);
      message.reply(`❌ Error: ${error.message || "Could not play song"}`);
    }
  }
  
  if (command === "skip" || command === "s") {
    const queue = queues.get(message.guild.id);
    if (!queue || !queue.isPlaying) {
      return message.reply("❌ Nothing is playing!");
    }
    
    queue.skip();
    message.react("⏭️");
  }
  
  if (command === "stop") {
    const queue = queues.get(message.guild.id);
    if (!queue) {
      return message.reply("❌ Nothing is playing!");
    }
    
    queue.stop();
    if (queue.connection) {
      queue.connection.destroy();
    }
    queues.delete(message.guild.id);
    message.react("⏹️");
  }
  
  if (command === "pause") {
    const queue = queues.get(message.guild.id);
    if (!queue || !queue.isPlaying) {
      return message.reply("❌ Nothing is playing!");
    }
    
    queue.pause();
    message.react("⏸️");
  }
  
  if (command === "resume") {
    const queue = queues.get(message.guild.id);
    if (!queue) {
      return message.reply("❌ Nothing to resume!");
    }
    
    queue.resume();
    message.react("▶️");
  }
  
  if (command === "queue" || command === "q") {
    const queue = queues.get(message.guild.id);
    if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
      return message.reply("❌ Queue is empty!");
    }
    
    let queueText = "";
    
    if (queue.currentSong) {
      queueText += `**🎵 Now Playing:**\n${queue.currentSong.title} [${queue.currentSong.source.toUpperCase()}]\n\n`;
    }
    
    if (queue.songs.length > 0) {
      queueText += "**📝 Up Next:**\n";
      queue.songs.slice(0, 10).forEach((song, index) => {
        queueText += `${index + 1}. ${song.title} - *${song.duration}* [${song.source.toUpperCase()}]\n`;
      });
      
      if (queue.songs.length > 10) {
        queueText += `\n*...and ${queue.songs.length - 10} more*`;
      }
    }
    
    const embed = new MessageEmbed()
      .setColor("#0099FF")
      .setTitle("🎵 Music Queue")
      .setDescription(queueText);
    
    message.channel.send({ embeds: [embed] });
  }
  
  if (command === "volume" || command === "vol") {
    const queue = queues.get(message.guild.id);
    if (!queue) {
      return message.reply("❌ Nothing is playing!");
    }
    
    if (!args.length) {
      return message.reply(`🔊 Current volume: **${Math.round(queue.volume * 100)}%**`);
    }
    
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply("❌ Volume must be between 0-100!");
    }
    
    queue.setVolume(volume / 100);
    message.reply(`🔊 Volume set to **${volume}%**`);
  }
  
  if (command === "nowplaying" || command === "np") {
    const queue = queues.get(message.guild.id);
    if (!queue || !queue.currentSong) {
      return message.reply("❌ Nothing is playing!");
    }
    
    const embed = new MessageEmbed()
      .setColor("#FF0000")
      .setTitle("🎵 Now Playing")
      .setDescription(`**${queue.currentSong.title}**`)
      .addFields(
        { name: "Duration", value: queue.currentSong.duration, inline: true },
        { name: "Source", value: queue.currentSong.source.toUpperCase(), inline: true },
        { name: "Requested by", value: queue.currentSong.requester, inline: true },
        { name: "Volume", value: `${Math.round(queue.volume * 100)}%`, inline: true }
      )
      .setThumbnail(queue.currentSong.thumbnail);
    
    message.channel.send({ embeds: [embed] });
  }
  
  // ========== AI COMMAND ==========
  
  if (command === "ask" || command === "ai") {
    if (!args.length) {
      return message.reply("❌ Ask me something! Example: `!ask what's a good song for parties`");
    }
    
    const question = args.join(" ");
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "HTTP-Referer": "https://discord.com",
          "X-Title": "Discord Music Bot"
        },
        body: JSON.stringify({
          model: "mistralai/devstral-2512:free",
          messages: [
            {
              role: "system",
              content: "You're a helpful music bot assistant. Give short, casual responses. Help with music recommendations, playlists, and general questions."
            },
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        return message.reply("❌ AI is having issues right now!");
      }
      
      const data = await response.json();
      const answer = data.choices[0].message.content;
      
      const embed = new MessageEmbed()
        .setColor("#9B59B6")
        .setTitle("🤖 AI Assistant")
        .addFields(
          { name: "Your Question", value: question },
          { name: "Answer", value: answer }
        )
        .setFooter({ text: `Asked by ${message.author.username}` });
      
      message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error("AI error:", error);
      message.reply("❌ Something went wrong with AI!");
    }
  }
  
  if (command === "help") {
    const embed = new MessageEmbed()
      .setColor("#FFD700")
      .setTitle("🎵 Multi-Source Music Bot")
      .setDescription("Play music from YouTube, Spotify, and SoundCloud!")
      .addFields(
        { name: "!play <song/url>", value: "Play from YouTube, Spotify, or SoundCloud" },
        { name: "!skip", value: "Skip current song" },
        { name: "!stop", value: "Stop playing and clear queue" },
        { name: "!pause", value: "Pause current song" },
        { name: "!resume", value: "Resume paused song" },
        { name: "!queue", value: "Show current queue" },
        { name: "!nowplaying", value: "Show current song info" },
        { name: "!volume <0-100>", value: "Set volume" },
        { name: "!ask <question>", value: "Ask AI assistant anything" },
        { name: "!help", value: "Show this help message" },
        { name: "\u200B", value: "**Supported Sources:**\n📺 YouTube (URLs & Search)\n🎵 Spotify (Tracks, Albums, Playlists)\n🔊 SoundCloud (Track URLs)" }
      )
      .setFooter({ text: "Made with ❤️" });
    
    message.channel.send({ embeds: [embed] });
  }
});

// Login
client.login(process.env.DIS_TOKEN);