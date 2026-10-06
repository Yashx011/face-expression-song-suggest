const spotifyService = require("../services/spotify.service");

async function searchSpotify(req, res) {
  try {
    const q = req.query.q;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;
    if (!q || !q.trim()) {
      return res.status(200).json({ results: [] });
    }

    const results = await spotifyService.searchTracks(q, { limit, offset });
    return res.status(200).json({ results });
  } catch (error) {
    console.error("Spotify search controller error:", error.message);
    return res.status(500).json({ message: error.message || "Spotify search failed", results: [] });
  }
}

async function getRecommendedNextTracks(req, res) {
  try {
    const {
      query = "",
      currentTitle = "",
      artists = "",
      mood = "",
      offset = 0,
      excludeTitles = [],
      excludeIds = []
    } = req.body || {};

    const results = await spotifyService.getRecommendedNextTracks({
      query,
      currentTitle,
      artists,
      mood,
      offset,
      excludeTitles,
      excludeIds
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Spotify recommend next controller error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to recommend tracks", results: [] });
  }
}

module.exports = {
  searchSpotify,
  getRecommendedNextTracks
};
