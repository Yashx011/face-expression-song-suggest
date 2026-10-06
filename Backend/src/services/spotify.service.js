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

async function searchTracks(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const token = await getSpotifyToken();
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=10`;

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

module.exports = {
  getSpotifyToken,
  searchTracks
};
