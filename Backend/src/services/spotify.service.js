let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify client credentials missing in environment");
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Spotify token error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

const songModel = require("../models/song.model");

async function searchTracks(query, { limit = 10, offset = 0 } = {}) {
  if (!query || !query.trim()) {
    return [];
  }

  const token = await getSpotifyToken();
  const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 10);
  const safeOffset = Math.max(parseInt(offset) || 0, 0);
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=${safeLimit}&offset=${safeOffset}`;

  const response = await fetch(searchUrl, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const items = data.tracks?.items || [];

  return items.map((item) => ({
    spotifyId: item.id,
    title: item.name,
    artists: item.artists ? item.artists.map((a) => a.name).join(", ") : "",
    albumName: item.album?.name || "",
    albumImage: item.album?.images?.[0]?.url || "",
    spotifyUrl: item.external_urls?.spotify || "",
    duration: item.duration_ms
  }));
}

const MOOD_SEARCH_TERMS = {
  happy: [
    "feel good bollywood",
    "happy bollywood songs",
    "feel good hits",
    "happy upbeat songs"
  ],
  sad: [
    "sad hindi songs",
    "sad bollywood songs",
    "emotional heartbreak songs",
    "sad songs"
  ],
  neutral: [
    "chill lofi hindi",
    "calm acoustic songs",
    "peaceful melodies",
    "chill vibes"
  ],
  surprised: [
    "party dance bollywood",
    "energetic dance hits",
    "upbeat dance hits",
    "party songs"
  ]
};

function getMoodQueries(mood) {
  if (!mood) return ["Bollywood hits"];
  const clean = mood.toLowerCase().trim();
  if (MOOD_SEARCH_TERMS[clean]) {
    return MOOD_SEARCH_TERMS[clean];
  }
  return [`${clean} songs`, "Bollywood hits"];
}

/**
 * Intelligent Next-Track Recommendation Generator
 * Generates fresh, non-duplicate tracks based on search query, current song, artist, and mood.
 */
async function getRecommendedNextTracks({
  query = "",
  currentTitle = "",
  artists = "",
  mood = "",
  offset = 0,
  excludeTitles = [],
  excludeIds = []
} = {}) {
  const lowerExcludes = new Set((excludeTitles || []).map((t) => (t || "").toLowerCase().trim()).filter(Boolean));
  const idExcludes = new Set((excludeIds || []).map((id) => String(id)).filter(Boolean));

  let tracks = [];

  const isExcluded = (t) => {
    if (!t) return true;
    if (t.spotifyId && idExcludes.has(String(t.spotifyId))) return true;
    const lowerTitle = (t.title || "").toLowerCase().trim();
    if (lowerExcludes.has(lowerTitle)) return true;
    if (tracks.some((existing) => existing.title.toLowerCase().trim() === lowerTitle || existing.spotifyId === t.spotifyId)) {
      return true;
    }
    return false;
  };

  // 1. If mood is explicitly passed without active search query/title, prioritize mood search from Spotify
  if (mood && !query && !currentTitle) {
    const queries = getMoodQueries(mood);
    for (const q of queries) {
      if (tracks.length >= 10) break;
      try {
        const moodTracks = await searchTracks(q, { limit: 10, offset: Math.max(offset, 0) });
        for (const t of moodTracks) {
          if (!isExcluded(t)) {
            tracks.push(t);
            if (tracks.length >= 10) break;
          }
        }
      } catch (err) {
        console.warn(`Recommendation mood search error for "${q}":`, err.message);
      }
    }
  }

  // 2. If user previously searched something, fetch next offset of that search
  if (tracks.length < 10 && query && query.trim()) {
    try {
      const qTracks = await searchTracks(query.trim(), { limit: 10, offset: Math.max(offset, 0) });
      for (const t of qTracks) {
        if (!isExcluded(t)) {
          tracks.push(t);
        }
      }
    } catch (err) {
      console.warn("Recommendation search query error:", err.message);
    }
  }

  // 3. If fewer than 10 tracks, search by the primary artist of the current song
  if (tracks.length < 10 && artists && artists.trim()) {
    const primaryArtist = artists.split(",")[0].trim();
    if (primaryArtist) {
      try {
        const randomArtistOffset = Math.floor(Math.random() * 5);
        const artistTracks = await searchTracks(primaryArtist, { limit: 10, offset: randomArtistOffset });
        for (const t of artistTracks) {
          if (!isExcluded(t)) {
            tracks.push(t);
          }
        }
      } catch (err) {
        console.warn("Recommendation artist search error:", err.message);
      }
    }
  }

  // 4. If still fewer than 10 tracks, clean up current title and search for related tracks
  if (tracks.length < 10 && currentTitle && currentTitle.trim()) {
    const cleanTitle = currentTitle.replace(/\(.*?\)|\[.*?\]|-.*|–.*/g, "").trim();
    if (cleanTitle && cleanTitle.toLowerCase() !== (query || "").toLowerCase()) {
      try {
        const titleTracks = await searchTracks(cleanTitle, { limit: 10, offset: 0 });
        for (const t of titleTracks) {
          if (!isExcluded(t)) {
            tracks.push(t);
          }
        }
      } catch (err) {
        console.warn("Recommendation title search error:", err.message);
      }
    }
  }

  // 5. If still fewer than 10 tracks and mood is present, continue mood search with secondary queries
  if (tracks.length < 10 && mood) {
    const queries = getMoodQueries(mood);
    for (const q of queries) {
      if (tracks.length >= 10) break;
      try {
        const moodTracks = await searchTracks(q, { limit: 10, offset: 0 });
        for (const t of moodTracks) {
          if (!isExcluded(t)) {
            tracks.push(t);
            if (tracks.length >= 10) break;
          }
        }
      } catch (err) {
        console.warn(`Recommendation mood search fallback error for "${q}":`, err.message);
      }
    }
  }

  // 6. Database fallback ONLY when NOT a mood-based recommendation (user explicitly requested bypassing local DB for mood recommendations)
  if (!mood && tracks.length < 5) {
    try {
      const dbSongs = await songModel.find({}).limit(10).lean();
      for (const s of dbSongs) {
        const lowerTitle = (s.title || "").toLowerCase().trim();
        if (!lowerExcludes.has(lowerTitle) && !tracks.some((x) => x.title.toLowerCase().trim() === lowerTitle)) {
          tracks.push({
            _id: s._id.toString(),
            spotifyId: s.spotifyId || s._id.toString(),
            title: s.title,
            artists: s.mood || "",
            albumName: "",
            albumImage: s.posterUrl,
            posterUrl: s.posterUrl,
            url: s.url,
            videoId: s.videoId,
            youtubeUrl: s.videoId ? `https://www.youtube.com/watch?v=${s.videoId}` : s.url
          });
        }
      }
    } catch (dbErr) {
      console.warn("Database fallback recommendation error:", dbErr.message);
    }
  }

  return tracks.slice(0, 10);
}

module.exports = {
  getSpotifyToken,
  searchTracks,
  getRecommendedNextTracks
};
