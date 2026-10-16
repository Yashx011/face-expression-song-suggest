const { GoogleGenAI, Type } = require("@google/genai");

const DEFAULT_MODEL = "gemini-3-flash-preview";
const MIN_SONGS = 5;
const MAX_SONGS = 30;
const DEFAULT_SONGS = 10;

/**
 * Validates and clamps a song count between MIN_SONGS (5) and MAX_SONGS (30).
 * Defaults to DEFAULT_SONGS (10) if missing, unparseable, or invalid.
 *
 * @param {number|string|null|undefined} count
 * @returns {number}
 */
function validateSongCount(count) {
  if (count === undefined || count === null || count === "") {
    return DEFAULT_SONGS;
  }
  const parsed = parseInt(count, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_SONGS;
  }
  return Math.min(Math.max(parsed, MIN_SONGS), MAX_SONGS);
}

/**
 * Detects whether an error is caused by Gemini quota exhaustion, rate limits,
 * or resource exhaustion.
 *
 * @param {Error|any} error
 * @returns {boolean}
 */
function isQuotaExhaustedError(error) {
  if (!error) return false;
  if (error.status === 429 || error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
    return true;
  }
  const str = String((error && error.message) || error).toLowerCase();
  return (
    str.includes("429") ||
    str.includes("resource_exhausted") ||
    str.includes("quota exceeded") ||
    str.includes("rate limit") ||
    str.includes("rate-limit") ||
    str.includes("exceeded your current quota") ||
    str.includes("free_tier_requests")
  );
}

/**
 * Safely sanitizes error messages to prevent leaking API keys, secrets,
 * or raw internal provider error JSON.
 *
 * @param {Error|any} error
 * @returns {Error}
 */
function sanitizeError(error) {
  if (isQuotaExhaustedError(error)) {
    const quotaErr = new Error("The AI service has temporarily reached its request limit. Please try again later.");
    quotaErr.status = 429;
    quotaErr.code = "RESOURCE_EXHAUSTED";
    return quotaErr;
  }

  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  let message = (error && error.message) || String(error) || "Unknown error occurred";

  // If raw provider error is a JSON string, extract only the readable text
  if (message.includes('{"error":') || message.startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch (e) {
      // not JSON
    }
  }

  if (apiKey) {
    message = message.split(apiKey).join("[REDACTED_API_KEY]");
  }
  message = message.replace(/key=[A-Za-z0-9_-]+/gi, "key=[REDACTED]");
  message = message.replace(/https?:\/\/[^\s]+/gi, "").trim();

  const sanitizedErr = new Error(`AI service failed to interpret playlist prompt: ${message}`);
  if (error && error.status) {
    sanitizedErr.status = error.status;
  }
  return sanitizedErr;
}

/**
 * Initializes and returns the GoogleGenAI client using the configured environment key.
 *
 * @returns {GoogleGenAI}
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * JSON schema definition for structured playlist interpretation with Gemini.
 */
const playlistInterpretationSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A creative, evocative title for the playlist",
    },
    description: {
      type: Type.STRING,
      description: "A concise 1-2 sentence description summarizing the vibe and musical theme",
    },
    mood: {
      type: Type.STRING,
      description: "The primary emotional mood (e.g., Chill, Focus, Melancholic, Energetic, Euphoric)",
    },
    vibe: {
      type: Type.STRING,
      description: "Atmosphere or aesthetic setting (e.g., Late-night coding, Rainy afternoon, Sunset drive)",
    },
    genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of relevant musical genres or sub-genres",
    },
    language: {
      type: Type.STRING,
      description: "Primary language of the requested tracks (e.g., Hindi, English, Punjabi) or empty string if unspecified",
    },
    artists: {
      type: Type.OBJECT,
      properties: {
        preferred: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Artists that strongly represent this vibe or were specifically requested",
        },
        excluded: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Artists the user wants excluded or who clash with this vibe",
        },
      },
      required: ["preferred", "excluded"],
    },
    searchQueries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 to 6 optimized search keywords tailored for finding real tracks on Spotify (e.g. genre, mood, or artist combinations)",
    },
    requestedSongCount: {
      type: Type.INTEGER,
      nullable: true,
      description: "Number of songs requested by the user if explicitly mentioned in their prompt, otherwise null",
    },
  },
  required: [
    "title",
    "description",
    "mood",
    "vibe",
    "genres",
    "artists",
    "searchQueries",
  ],
};

const SYSTEM_INSTRUCTION = `You are Moodify's AI music curator.
Your task is to analyze natural language playlist requests and translate them into structured music preferences.

CRITICAL INSTRUCTIONS:
1. Do NOT invent fake song IDs, fake track titles, Spotify URLs, Spotify URIs, or YouTube URLs. Moodify connects to real music streaming APIs and will search real catalogs using your queries and criteria.
2. Focus on extracting accurate musical preferences: mood, vibe, genres, language, preferred/excluded artists, and realistic search phrases.
3. If the user mentions a language preference (e.g., Hindi, Spanish, Punjabi), specify it in the 'language' field. If unspecified, return an empty string.
4. Provide 3-6 diverse, high-quality search queries optimized for Spotify catalog search (e.g., combining artist names, sub-genres, or mood keywords).
5. If the user explicitly asks for a certain number of songs in their prompt (e.g., "give me 8 songs", "15 tracks"), capture that number in 'requestedSongCount'. If they did NOT explicitly state a number of songs in the prompt, you MUST set 'requestedSongCount' to null. Do NOT guess or default a number.
6. Return only valid JSON conforming strictly to the response schema.`;

/**
 * Cleans and normalizes the structured JSON output from Gemini and ensures
 * backend validation rules (such as song count bounds) are strictly enforced.
 *
 * @param {Object} rawOutput - Parsed JSON object from Gemini
 * @param {string} originalPrompt - The original user prompt text
 * @param {number|undefined} userExplicitCount - Optional song count override passed in options
 * @returns {Object} Cleaned playlist interpretation
 */
function normalizeAiResponse(rawOutput, originalPrompt, userExplicitCount) {
  const cleanStr = (val, fallback = "") =>
    typeof val === "string" && val.trim() ? val.trim() : fallback;

  const cleanStrArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  };

  // Determine language (null if empty or unspecified)
  let language = null;
  if (typeof rawOutput.language === "string" && rawOutput.language.trim()) {
    const lang = rawOutput.language.trim();
    const ignoredValues = ["any", "all", "none", "n/a", "null", "unspecified"];
    if (!ignoredValues.includes(lang.toLowerCase())) {
      language = lang;
    }
  }

  // Determine candidate song count:
  // 1. Explicitly passed in options
  // 2. Extracted by AI and confirmed to exist in the user's prompt text
  // 3. Fallback to detecting explicit song count patterns directly in the prompt text
  let candidateCount = null;

  if (userExplicitCount !== undefined && userExplicitCount !== null && userExplicitCount !== "") {
    candidateCount = userExplicitCount;
  } else if (
    typeof rawOutput.requestedSongCount === "number" &&
    !Number.isNaN(rawOutput.requestedSongCount)
  ) {
    // Cross-verify with the prompt text to ensure backend doesn't trust hallucinated numbers
    const promptDigits = originalPrompt.match(/\b\d{1,3}\b/g);
    if (promptDigits && promptDigits.some((d) => parseInt(d, 10) === rawOutput.requestedSongCount)) {
      candidateCount = rawOutput.requestedSongCount;
    }
  }

  if (candidateCount === null) {
    const match = originalPrompt.match(/\b(\d{1,3})\s*(?:songs?|tracks?|gaane|geet|items?|tunes?)\b/i);
    if (match) {
      candidateCount = parseInt(match[1], 10);
    }
  }

  // Validate and clamp in backend code (5 to 30, defaults to 10 if unspecified)
  const songCount = validateSongCount(candidateCount);

  // Normalize artists
  const preferredArtists = cleanStrArray(rawOutput.artists?.preferred);
  const excludedArtists = cleanStrArray(rawOutput.artists?.excluded);

  // Normalize search queries with fallback
  let searchQueries = cleanStrArray(rawOutput.searchQueries);
  if (searchQueries.length === 0) {
    const fallbackQuery = [cleanStr(rawOutput.mood), language, cleanStrArray(rawOutput.genres)[0]]
      .filter(Boolean)
      .join(" ");
    searchQueries = [fallbackQuery || cleanStr(rawOutput.title, "chill music")];
  }

  return {
    title: cleanStr(rawOutput.title, "Moodify Playlist"),
    description: cleanStr(rawOutput.description, "Curated tracks based on your mood."),
    mood: cleanStr(rawOutput.mood, "Chill"),
    vibe: cleanStr(rawOutput.vibe, "Relaxing"),
    genres: cleanStrArray(rawOutput.genres),
    language,
    artists: {
      preferred: preferredArtists,
      excluded: excludedArtists,
    },
    searchQueries,
    songCount,
  };
}

/**
 * Interprets a user playlist prompt using Gemini and returns structured music preferences.
 *
 * @param {string} prompt - User prompt (e.g. "Make me a chill Hindi playlist for late-night coding")
 * @param {Object} [options]
 * @param {number} [options.songCount] - Optional override for song count (5-30)
 * @param {string} [options.model] - Optional Gemini model name override
 * @returns {Promise<{
 *   title: string,
 *   description: string,
 *   mood: string,
 *   vibe: string,
 *   genres: string[],
 *   language: string|null,
 *   artists: { preferred: string[], excluded: string[] },
 *   searchQueries: string[],
 *   songCount: number
 * }>}
 */
async function interpretPlaylistPrompt(prompt, options = {}) {
  // 1. Input validation
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A valid non-empty playlist prompt string is required.");
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length > 2000) {
    throw new Error("Playlist prompt is too long. Please keep requests under 2000 characters.");
  }

  const modelName = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: modelName,
      contents: trimmedPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: playlistInterpretationSchema,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.6,
      },
    });

    const rawText = response.text;
    if (!rawText || !rawText.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed;
    try {
      let cleanText = rawText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
    }

    return normalizeAiResponse(parsed, trimmedPrompt, options.songCount);
  } catch (error) {
    throw sanitizeError(error);
  }
}

module.exports = {
  interpretPlaylistPrompt,
  parsePlaylistPrompt: interpretPlaylistPrompt, // Alias for convenience
  validateSongCount,
  isQuotaExhaustedError,
  DEFAULT_SONGS,
  MIN_SONGS,
  MAX_SONGS,
};
