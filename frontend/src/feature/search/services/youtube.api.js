import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true
});

const youtubeMatchCache = new Map();

export const searchYouTubeApi = async (query) => {
  const response = await api.get("/api/youtube/search", {
    params: { q: query }
  });
  return response.data;
};

export const getOrMatchYouTubeTrack = async (track) => {
  if (!track) return null;

  // If already matched with videoId
  if (track.youtubeId && track.youtubeUrl) {
    return track;
  }

  // Cache key based on spotifyId or title + artists
  const cacheKey = track.spotifyId || `${track.title || ""}-${track.artists || ""}`;
  if (youtubeMatchCache.has(cacheKey)) {
    const cachedMatch = youtubeMatchCache.get(cacheKey);
    return {
      ...track,
      youtubeId: cachedMatch.videoId,
      youtubeUrl: cachedMatch.youtubeUrl,
      source: "youtube"
    };
  }

  // Build query from song title + primary artist
  const primaryArtist = track.artists ? track.artists.split(",")[0].trim() : "";
  const searchQuery = `${track.title || ""} ${primaryArtist}`.trim();

  if (!searchQuery) {
    return track;
  }

  try {
    const data = await searchYouTubeApi(searchQuery);
    const results = data.results || [];
    if (results.length > 0) {
      const match = results[0];
      youtubeMatchCache.set(cacheKey, match);
      return {
        ...track,
        youtubeId: match.videoId,
        youtubeUrl: match.youtubeUrl,
        source: "youtube"
      };
    }
  } catch (err) {
    console.error("YouTube match error:", err);
  }

  return {
    ...track,
    source: "spotify_only"
  };
};
