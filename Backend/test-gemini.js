const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.error("❌ Test Failed: GEMINI_API_KEY is not defined in Backend/.env");
    console.error("Please add GEMINI_API_KEY=<your-key> to Backend/.env and try again.");
    process.exit(1);
  }

  console.log("🔑 GEMINI_API_KEY detected in Backend/.env");
  const modelName = "gemini-3-flash-preview";
  console.log(`📡 Sending test prompt to Gemini (${modelName})...`);

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Respond in one short sentence: Say hello to Moodify and confirm that the Gemini API is working properly.",
    });

    console.log("\n✅ Gemini API connection successful!");
    console.log("🤖 Response:\n" + (response.text || "").trim());
  } catch (error) {
    // Sanitize any key leakage in error output
    let cleanMessage = error.message || String(error);
    if (apiKey) {
      cleanMessage = cleanMessage.split(apiKey.trim()).join("[REDACTED_API_KEY]");
    }
    cleanMessage = cleanMessage.replace(/key=[A-Za-z0-9_-]+/g, "key=[REDACTED]");

    console.error("\n❌ Test Failed: Could not connect to Gemini API");
    console.error("Error details:", cleanMessage);
    if (error.status) {
      console.error("HTTP Status code:", error.status);
    }
    process.exit(1);
  }
}

testGemini();
