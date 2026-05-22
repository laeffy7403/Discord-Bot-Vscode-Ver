// Run this file standalone to test your API key and connection
// Usage: node debug_test.js
require("dotenv").config();

const fetch = require("node-fetch");

async function test() {
  console.log("=== DEBUG TEST ===");
  console.log("DIS_TOKEN exists:", !!process.env.DIS_TOKEN);
  console.log("OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);
  console.log("OPENROUTER_API_KEY starts with:", process.env.OPENROUTER_API_KEY?.substring(0, 8) + "...");
  
  console.log("\n--- Testing OpenRouter API ---");
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://your-site.com",
        "X-Title": "Discord Bot"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-next-80b-a3b-instruct:free",
        messages: [{ role: "user", content: "say hi" }],
        max_tokens: 50
      })
    });

    console.log("HTTP Status:", response.status);
    const text = await response.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

test();