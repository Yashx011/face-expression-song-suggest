const spotifyService = require("../services/spotify.service");

async function searchSpotify(req, res) {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(200).json({ results: [] });
    }

    const results = await spotifyService.searchTracks(q);
    return res.status(200).json({ results });
  } catch (error) {
    console.error("Spotify search controller error:", error.message);
    return res.status(500).json({ message: error.message || "Spotify search failed", results: [] });
  }
}

module.exports = {
  searchSpotify
};
