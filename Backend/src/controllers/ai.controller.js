const aiService = require("../services/ai.service");
const playlistDiscoveryService = require("../services/playlistDiscovery.service");

/**
 * Detects whether an error is caused by Gemini quota exhaustion, rate limits,
 * or resource exhaustion.
 *
 * @param {Error|any} error
 * @returns {boolean}
 */
function isQuotaExhaustedError(error) {
  if (typeof aiService.isQuotaExhaustedError === "function") {
    return aiService.isQuotaExhaustedError(error);
  }
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
    str.includes("reached its request limit")
  );
}

/**
 * Sanitizes error messages to prevent exposing API keys, secrets, or internal details.
 *
 * @param {Error|any} error
 * @returns {string} Clean, safe error message
 */
function sanitizeError(error) {
  if (isQuotaExhaustedError(error)) {
    return "The AI service has temporarily reached its request limit. Please try again later.";
  }

  let message = (error && error.message) || String(error) || "An unexpected error occurred.";

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

  const sensitiveValues = [
    process.env.GEMINI_API_KEY,
    process.env.YOUTUBE_API_KEY,
    process.env.SPOTIFY_CLIENT_SECRET,
    process.env.JWT_SECRET,
  ].filter(Boolean);

  for (const secret of sensitiveValues) {
    if (typeof secret === "string" && secret.trim()) {
      message = message.split(secret.trim()).join("[REDACTED]");
    }
  }

  message = message.replace(/key=[A-Za-z0-9_-]+/gi, "key=[REDACTED]");
  message = message.replace(/https?:\/\/[^\s]+/gi, "").trim();
  return message;
}

/**
 * Generates an AI playlist from a natural-language prompt.
 * Protected endpoint requiring authentication.
 *
 * Request body:
 * - prompt: string (required, 1-2000 chars)
 * - songCount: number (optional, integer between 5 and 30)
 *
 * Response (Success - 200):
 * - success: true
 * - playlist: { title, description, mood, vibe, genres, language, artists, requestedCount, totalTracks, source }
 * - tracks: Array<Track>
 * - source: "spotify" | "youtube"
 * - fallbackUsed: boolean
 * - notice?: string
 */
async function generatePlaylist(req, res) {
  try {
    const { prompt, songCount } = req.body || {};

    // 1. Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid non-empty playlist prompt string is required.",
      });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Playlist prompt is too long. Please keep requests under 2000 characters.",
      });
    }

    // 2. Validate requested song count if provided
    let validatedSongCount = undefined;
    if (songCount !== undefined && songCount !== null && songCount !== "") {
      const parsedCount = Number(songCount);
      if (!Number.isInteger(parsedCount) || parsedCount < 5 || parsedCount > 30) {
        return res.status(400).json({
          success: false,
          message: "Song count must be an integer between 5 and 30.",
        });
      }
      validatedSongCount = parsedCount;
    }

    // 3. Interpret prompt using Gemini AI service
    const playlistPlan = await aiService.interpretPlaylistPrompt(trimmedPrompt, {
      songCount: validatedSongCount,
    });

    // 4. Discover tracks via Spotify with automatic YouTube fallback on 403
    const discoveryResult = await playlistDiscoveryService.discoverTracksForPlaylist(playlistPlan, {
      songCount: validatedSongCount,
    });

    // 5. Ensure discovery did not fail or return 0 usable tracks
    if (!discoveryResult.tracks || discoveryResult.tracks.length === 0) {
      const failureMessage =
        discoveryResult.error ||
        discoveryResult.warning ||
        "Track discovery failed: No usable tracks found for the playlist request.";

      return res.status(502).json({
        success: false,
        message: failureMessage,
        playlist: discoveryResult.playlist || null,
        tracks: [],
      });
    }

    // 6. Return successful response with metadata and tracks
    return res.status(200).json({
      success: true,
      playlist: discoveryResult.playlist,
      tracks: discoveryResult.tracks,
      source: discoveryResult.source || "youtube",
      fallbackUsed: Boolean(discoveryResult.fallbackUsed),
      notice: discoveryResult.notice || null,
    });
  } catch (error) {
    if (isQuotaExhaustedError(error)) {
      const quotaMessage = "The AI service has temporarily reached its request limit. Please try again later.";
      console.warn("AI playlist controller notice: Gemini quota limit reached (429).");
      return res.status(429).json({
        success: false,
        message: quotaMessage,
      });
    }

    const safeMessage = sanitizeError(error);
    console.error("AI playlist controller error:", safeMessage);
    const statusCode =
      error && typeof error.status === "number" && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    return res.status(statusCode).json({
      success: false,
      message: safeMessage,
    });
  }
}

module.exports = {
  generatePlaylist,
  sanitizeError,
};
