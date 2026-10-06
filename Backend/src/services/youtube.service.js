async function searchVideos(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY missing in environment");
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(query.trim())}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item) => ({
    videoId: item.id?.videoId || "",
    title: item.snippet?.title || "",
    channel: item.snippet?.channelTitle || "",
    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
    youtubeUrl: `https://www.youtube.com/watch?v=${item.id?.videoId || ""}`
  }));
}

module.exports = {
  searchVideos
};
