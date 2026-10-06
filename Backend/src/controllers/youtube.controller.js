const youtubeService = require("../services/youtube.service");

async function searchYouTube(req, res) {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const results = await youtubeService.searchVideos(q);
    return res.status(200).json({ results });
  } catch (error) {
    console.error("YouTube search controller error:", error.message);
    return res.status(500).json({ message: error.message || "YouTube search failed", results: [] });
  }
}

module.exports = {
  searchYouTube
};
