const spotifyService = require("./spotify.service");
const youtubeService = require("./youtube.service");
const { validateSongCount } = require("./ai.service");

// Spotify 403 active premium restriction cooldown cache (5 minutes)
let spotifyDisabledUntil = 0;
const SPOTIFY_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Decodes common HTML entities often returned by the YouTube API.
 *
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Builds an ordered list of search queries from the AI playlist plan.
 * Prioritizes the AI's tailored searchQueries, followed by queries derived from
 * preferred artists, genres, language, and mood without redundant wording.
 *
 * @param {Object} plan - Structured output from interpretPlaylistPrompt()
 * @returns {string[]} Ordered list of unique query strings
 */
function buildDiscoveryQueries(plan) {
  const queries = [];
  const seenQueries = new Set();

  const addQuery = (q) => {
    if (!q || typeof q !== "string") return;
    const clean = q.replace(/\s+/g, " ").trim();
    const lower = clean.toLowerCase();
    if (clean.length > 0 && !seenQueries.has(lower)) {
      seenQueries.add(lower);
      queries.push(clean);
    }
  };

  // 1. Primary AI search queries
  if (Array.isArray(plan.searchQueries)) {
    for (const q of plan.searchQueries) {
      addQuery(q);
    }
  }

  const lang = plan.language && typeof plan.language === "string" ? plan.language.trim() : "";
  const langLower = lang.toLowerCase();
  const preferredArtists = Array.isArray(plan.artists?.preferred) ? plan.artists.preferred : [];
  const genres = Array.isArray(plan.genres) ? plan.genres : [];

  // 2. Preferred artists with language context
  for (const artist of preferredArtists) {
    if (artist && typeof artist === "string") {
      const trimmedArtist = artist.trim();
      if (lang && !trimmedArtist.toLowerCase().includes(langLower)) {
        addQuery(`${trimmedArtist} ${lang}`);
      }
      addQuery(trimmedArtist);
    }
  }

  // 3. Genres with language context
  for (const genre of genres) {
    if (genre && typeof genre === "string") {
      const trimmedGenre = genre.trim();
      if (lang && !trimmedGenre.toLowerCase().includes(langLower)) {
        addQuery(`${lang} ${trimmedGenre}`);
      }
      addQuery(trimmedGenre);
    }
  }

  // 4. Mood & vibe combinations
  if (plan.mood) {
    const topGenre = (genres[0] || "music").trim();
    if (lang && !topGenre.toLowerCase().includes(langLower)) {
      addQuery(`${plan.mood} ${lang} ${topGenre}`);
    } else {
      addQuery(`${plan.mood} ${topGenre}`);
    }

    if (plan.vibe) {
      addQuery(`${plan.mood} ${plan.vibe}`);
    }
  }

  return queries;
}

/**
 * Determines whether a track matches any of the excluded artists.
 * Checks against both artist string and title.
 *
 * @param {Object} track - Track object (Spotify or YouTube)
 * @param {string[]} excludedArtists - Array of artist names to exclude
 * @returns {boolean} True if the track contains an excluded artist
 */
function isTrackExcluded(track, excludedArtists = []) {
  if (!track) return false;
  if (!Array.isArray(excludedArtists) || excludedArtists.length === 0) return false;

  const trackArtistsStr = (track.artists || track.channel || "").toLowerCase();
  const trackTitleStr = (track.title || "").toLowerCase();

  for (const excluded of excludedArtists) {
    if (!excluded || typeof excluded !== "string") continue;
    const cleanExcluded = excluded.trim().toLowerCase();
    if (cleanExcluded.length > 0) {
      if (trackArtistsStr.includes(cleanExcluded) || trackTitleStr.includes(cleanExcluded)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates a normalized signature for a track to detect duplicates
 * that may have different IDs (e.g. single vs album releases, or multiple YouTube uploads).
 *
 * @param {Object} track
 * @returns {string} Normalized title::artist signature
 */
function getTrackSignature(track) {
  if (!track || !track.title) return "";
  const cleanTitle = track.title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|-.*|–.*/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  const primaryArtist = (track.artists || "")
    .split(",")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return `${cleanTitle}::${primaryArtist}`;
}

/**
 * Normalizes raw track data into Moodify's standard track structure.
 *
 * @param {Object} item - Track item from Spotify
 * @returns {Object} Standardized Moodify track object
 */
function normalizeSpotifyTrack(item) {
  const albumImg = item.albumImage || item.posterUrl || "";
  const spId = item.spotifyId || item.id || "";
  return {
    _id: spId,
    spotifyId: spId,
    videoId: null,
    youtubeId: null,
    title: item.title || item.name || "",
    artists: item.artists || "",
    albumName: item.albumName || "",
    albumImage: albumImg,
    posterUrl: albumImg,
    url: "",
    spotifyUrl: item.spotifyUrl || "",
    youtubeUrl: null,
    source: "spotify",
    duration: typeof item.duration === "number" ? item.duration : (item.duration_ms || 0),
  };
}

/**
 * Normalizes raw YouTube search video items into Moodify's standard track structure.
 *
 * @param {Object} item - Video item from youtubeService.searchVideos()
 * @returns {Object} Standardized Moodify track object
 */
function normalizeYouTubeTrack(item) {
  const vId = item.videoId || "";
  const thumb = item.thumbnail || "";
  const channelName = decodeHtmlEntities(item.channel || "");
  const cleanTitle = decodeHtmlEntities(item.title || "");
  const ytUrl = item.youtubeUrl || (vId ? `https://www.youtube.com/watch?v=${vId}` : "");

  return {
    _id: vId,
    spotifyId: null,
    videoId: vId,
    youtubeId: vId,
    title: cleanTitle,
    artists: channelName,
    albumName: "",
    albumImage: thumb,
    posterUrl: thumb,
    url: ytUrl,
    spotifyUrl: "",
    youtubeUrl: ytUrl,
    source: "youtube",
    duration: 0,
  };
}

/**
 * Discovers real tracks through YouTube search when Spotify search is unavailable.
 * Respects API quota limits by only executing the minimum necessary queries.
 *
 * @param {Object} playlistPlan - Structured output from interpretPlaylistPrompt()
 * @param {number} targetCount - Clamped number of tracks required (5-30)
 * @param {Object} [options]
 * @param {Function} [options.youtubeSearchFn] - Optional search function (defaults to youtubeService.searchVideos)
 * @param {string[]} [options.excludedArtists] - Excluded artists array
 * @returns {Promise<{ tracks: Object[], error?: string }>}
 */
async function discoverTracksFromYouTube(playlistPlan, targetCount, options = {}) {
  const searchFn = typeof options.youtubeSearchFn === "function"
    ? options.youtubeSearchFn
    : youtubeService.searchVideos;

  const excludedArtists = Array.isArray(options.excludedArtists)
    ? options.excludedArtists
    : (Array.isArray(playlistPlan.artists?.excluded) ? playlistPlan.artists.excluded : []);

  const queries = buildDiscoveryQueries(playlistPlan);
  const collectedTracks = [];
  const seenVideoIds = new Set();
  const seenSignatures = new Set();
  const youtubeErrors = [];

  const tryAddTrack = (rawItem) => {
    if (!rawItem) return false;
    const track = normalizeYouTubeTrack(rawItem);
    if (!track.videoId || !track.title) return false;
    if (seenVideoIds.has(track.videoId)) return false;

    const signature = getTrackSignature(track);
    if (signature && signature.length > 5 && seenSignatures.has(signature)) return false;

    if (isTrackExcluded(track, excludedArtists)) return false;

    seenVideoIds.add(track.videoId);
    if (signature && signature.length > 5) seenSignatures.add(signature);
    collectedTracks.push(track);
    return true;
  };

  // Determine query batching:
  // Run up to 2 queries concurrently with optimal maxResults to retrieve enough candidate tracks in 1 round-trip
  const perQueryLimit = Math.min(25, Math.max(10, Math.ceil(targetCount * 1.2)));
  const initialBatch = queries.slice(0, 2);

  const batchResults = await Promise.allSettled(
    initialBatch.map((query) => {
      const qLower = query.toLowerCase();
      const ytQuery = (qLower.includes("song") || qLower.includes("music") || qLower.includes("audio"))
        ? query
        : `${query} song`;
      return searchFn(ytQuery, { maxResults: perQueryLimit });
    })
  );

  for (let idx = 0; idx < batchResults.length; idx++) {
    const res = batchResults[idx];
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const item of res.value) {
        tryAddTrack(item);
        if (collectedTracks.length >= targetCount) break;
      }
    } else if (res.status === "rejected") {
      youtubeErrors.push(`"${initialBatch[idx]}": ${res.reason?.message || String(res.reason)}`);
    }
    if (collectedTracks.length >= targetCount) break;
  }

  // If still need more tracks and remaining queries exist, try remaining queries sequentially
  if (collectedTracks.length < targetCount && queries.length > 2) {
    for (let i = 2; i < Math.min(queries.length, 5); i++) {
      if (collectedTracks.length >= targetCount) break;
      const query = queries[i];

      try {
        const qLower = query.toLowerCase();
        const ytQuery = (qLower.includes("song") || qLower.includes("music") || qLower.includes("audio"))
          ? query
          : `${query} song`;

        const results = await searchFn(ytQuery, { maxResults: perQueryLimit });
        if (Array.isArray(results)) {
          for (const item of results) {
            tryAddTrack(item);
            if (collectedTracks.length >= targetCount) break;
          }
        }
      } catch (err) {
        const errMsg = err?.message || String(err);
        youtubeErrors.push(`"${query}": ${errMsg}`);
      }
    }
  }

  const finalTracks = collectedTracks.slice(0, targetCount);
  let errorMsg = null;
  if (finalTracks.length === 0 && youtubeErrors.length > 0) {
    errorMsg = `YouTube search failed: ${youtubeErrors[0]}`;
  }

  return {
    tracks: finalTracks,
    error: errorMsg,
  };
}

/**
 * Discovers real tracks based on a structured AI playlist plan.
 *
 * 1. Tries Spotify search first using configured client credentials.
 * 2. If Spotify search fails (e.g. 403 active premium subscription restriction),
 *    safely falls back to YouTube search to discover real playable tracks.
 * 3. Enforces target songCount (5–30), strict deduplication, and artist exclusion.
 * 4. If both sources fail, returns a clear, safe error without pretending tracks were found.
 *
 * @param {Object} playlistPlan - Structured output from interpretPlaylistPrompt()
 * @param {Object} [options]
 * @param {number} [options.songCount] - Optional override for song count (5-30)
 * @param {Function} [options.searchFn] - Optional Spotify search function override
 * @param {Function} [options.youtubeSearchFn] - Optional YouTube search function override
 * @param {boolean} [options.fallbackToYouTube=true] - Whether to fall back to YouTube on Spotify error
 * @returns {Promise<{
 *   playlist: {
 *     title: string,
 *     description: string,
 *     mood: string,
 *     vibe: string,
 *     genres: string[],
 *     language: string|null,
 *     artists: { preferred: string[], excluded: string[] },
 *     requestedCount: number,
 *     totalTracks: number,
 *     source: string|null
 *   },
 *   tracks: Array<Object>,
 *   source?: string,
 *   fallbackUsed?: boolean,
 *   warning?: string,
 *   error?: string
 * }>}
 */
async function discoverTracksForPlaylist(playlistPlan, options = {}) {
  if (!playlistPlan || typeof playlistPlan !== "object") {
    throw new Error("A valid structured playlist plan object is required.");
  }

  const targetCount = validateSongCount(options.songCount ?? playlistPlan.songCount);
  const spotifySearchFn = typeof options.searchFn === "function" ? options.searchFn : spotifyService.searchTracks;
  const allowYouTubeFallback = options.fallbackToYouTube !== false;

  const excludedArtists = Array.isArray(playlistPlan.artists?.excluded)
    ? playlistPlan.artists.excluded
    : [];

  const queries = buildDiscoveryQueries(playlistPlan);
  const collectedTracks = [];
  const seenSpotifyIds = new Set();
  const seenSignatures = new Set();
  const spotifyErrors = [];

  const tryAddSpotifyTrack = (rawTrack) => {
    if (!rawTrack) return false;
    const track = normalizeSpotifyTrack(rawTrack);

    if (!track.spotifyId || !track.title) return false;
    if (seenSpotifyIds.has(track.spotifyId)) return false;

    const signature = getTrackSignature(track);
    if (signature && seenSignatures.has(signature)) return false;

    if (isTrackExcluded(track, excludedArtists)) return false;

    seenSpotifyIds.add(track.spotifyId);
    if (signature) seenSignatures.add(signature);
    collectedTracks.push(track);
    return true;
  };

  // ── Step 1: Attempt Spotify Search (bypassed if on active cooldown) ──
  const isSpotifyTemporarilyDisabled = Date.now() < spotifyDisabledUntil;
  if (isSpotifyTemporarilyDisabled && !options.forceSpotify) {
    spotifyErrors.push("Spotify search temporarily bypassed due to active subscription restriction (cached).");
  } else {
    for (const query of queries) {
      if (collectedTracks.length >= targetCount) break;

      try {
        const results = await spotifySearchFn(query, { limit: 10, offset: 0 });
        if (Array.isArray(results)) {
          for (const item of results) {
            tryAddSpotifyTrack(item);
            if (collectedTracks.length >= targetCount) break;
          }
        }
      } catch (err) {
        const errMsg = err?.message || String(err);
        spotifyErrors.push(`"${query}": ${errMsg}`);
        // If we encounter a 403 subscription error, remember cooldown and stop spamming Spotify edge gateway
        if (errMsg.includes("403") || errMsg.includes("subscription")) {
          spotifyDisabledUntil = Date.now() + SPOTIFY_COOLDOWN_MS;
          break;
        }
      }
    }

    if (collectedTracks.length > 0) {
      spotifyDisabledUntil = 0; // Reset cooldown if Spotify succeeded
    }
  }

  // If Spotify succeeded with at least some tracks and we still need more, try secondary offset
  if (collectedTracks.length > 0 && collectedTracks.length < targetCount && queries.length > 0) {
    for (const query of queries.slice(0, 3)) {
      if (collectedTracks.length >= targetCount) break;

      try {
        const results = await spotifySearchFn(query, { limit: 10, offset: 10 });
        if (Array.isArray(results)) {
          for (const item of results) {
            tryAddSpotifyTrack(item);
            if (collectedTracks.length >= targetCount) break;
          }
        }
      } catch (err) {
        // Safe skip on offset error
      }
    }
  }

  // ── Step 2: YouTube Fallback (if Spotify yielded 0 tracks and had errors) ──
  let fallbackUsed = false;
  let youtubeErrorMsg = null;
  let activeSource = "spotify";

  if (collectedTracks.length === 0 && allowYouTubeFallback && (spotifyErrors.length > 0 || options.forceFallback)) {
    const ytResult = await discoverTracksFromYouTube(playlistPlan, targetCount, {
      youtubeSearchFn: options.youtubeSearchFn,
      excludedArtists,
    });

    if (ytResult.tracks.length > 0) {
      collectedTracks.push(...ytResult.tracks);
      fallbackUsed = true;
      activeSource = "youtube";
    } else if (ytResult.error) {
      youtubeErrorMsg = ytResult.error;
    }
  }

  const finalTracks = collectedTracks.slice(0, targetCount);

  const playlistMeta = {
    title: playlistPlan.title || "Moodify AI Playlist",
    description: playlistPlan.description || "Curated playlist created with Moodify AI.",
    mood: playlistPlan.mood || "Chill",
    vibe: playlistPlan.vibe || "Relaxed",
    genres: Array.isArray(playlistPlan.genres) ? playlistPlan.genres : [],
    language: playlistPlan.language || null,
    artists: {
      preferred: Array.isArray(playlistPlan.artists?.preferred) ? playlistPlan.artists.preferred : [],
      excluded: excludedArtists,
    },
    requestedCount: targetCount,
    totalTracks: finalTracks.length,
    source: finalTracks.length > 0 ? activeSource : null,
  };

  const result = {
    playlist: playlistMeta,
    tracks: finalTracks,
    source: finalTracks.length > 0 ? activeSource : null,
  };

  if (fallbackUsed) {
    result.fallbackUsed = true;
    result.notice = "Tracks discovered via YouTube fallback due to Spotify app access restriction.";
  }

  // ── Step 3: Handle complete failure safely without pretending tracks exist ──
  if (finalTracks.length === 0) {
    const errorDetails = [
      spotifyErrors.length > 0 ? `Spotify error: ${spotifyErrors[0]}` : null,
      youtubeErrorMsg ? `YouTube error: ${youtubeErrorMsg}` : null,
    ].filter(Boolean).join("; ");

    const failureMessage = errorDetails
      ? `Track discovery failed: ${errorDetails}`
      : "Track discovery failed: No matching tracks found across search providers.";

    result.error = failureMessage;
    result.warning = failureMessage;
  }

  return result;
}

/**
 * End-to-end convenience method: interprets prompt using Gemini and discovers tracks.
 *
 * @param {string} prompt - User's playlist prompt
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function generatePlaylistTracks(prompt, options = {}) {
  const { interpretPlaylistPrompt } = require("./ai.service");
  const plan = await interpretPlaylistPrompt(prompt, options);
  return discoverTracksForPlaylist(plan, options);
}

module.exports = {
  discoverTracksForPlaylist,
  discoverTracksFromYouTube,
  generatePlaylistTracks,
  buildDiscoveryQueries,
  isTrackExcluded,
  normalizeSpotifyTrack,
  normalizeYouTubeTrack,
  decodeHtmlEntities,
};
