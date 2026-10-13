import { useState, useEffect, useContext } from "react";
import { getSavedSongs, toggleSaveSong } from "../../home/services/song.api";
import { getOrMatchYouTubeTrack } from "../../search/services/youtube.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/favorites.scss";

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSong, setQueue, setIsPlaying, setSavedTime } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    getSavedSongs()
      .then((data) => {
        if (isMounted) {
          setFavorites(data.songs || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load favorites.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayFavorite = async (songItem) => {
    if (!songItem || !setSong) return;

    if (setSavedTime) setSavedTime(0);

    let playable = {
      ...songItem,
      _id: songItem._id || songItem.spotifyId || songItem.videoId,
      posterUrl: songItem.posterUrl || songItem.albumImage || DEFAULT_POSTER,
      mood: songItem.mood || songItem.artists || "",
      title: songItem.title || ""
    };

    if (!songItem.videoId || songItem.videoId.length > 15 || songItem.videoId === songItem.spotifyId) {
      try {
        const matched = await getOrMatchYouTubeTrack(playable);
        if (matched?.youtubeId || matched?.videoId) {
          playable = {
            ...playable,
            ...matched,
            videoId: matched.youtubeId || matched.videoId,
            youtubeId: matched.youtubeId || matched.videoId
          };
        }
      } catch (err) {
        console.error("Match error on favorite play:", err);
      }
    }

    setSong(playable);
    if (favorites.length > 0 && setQueue) {
      setQueue(favorites.map(s => ({
        ...s,
        _id: s._id || s.spotifyId || s.videoId,
        posterUrl: s.posterUrl || s.albumImage || DEFAULT_POSTER,
        mood: s.mood || s.artists || "",
        title: s.title || ""
      })));
    }
    if (setIsPlaying) setIsPlaying(true);
  };

  const handleUnsave = async (e, songId) => {
    e.stopPropagation();
    try {
      await toggleSaveSong(songId);
      setFavorites((prev) => prev.filter((s) => s._id !== songId));
    } catch (err) {
      console.error("Failed to unsave song:", err);
    }
  };

  return (
    <div className="favorites-page">
      <Navbar />
      <header className="favorites-header">
        <h1>Bookmark Favorites</h1>
        <p>Your saved songs collection</p>
      </header>

      {loading ? (
        <div className="glass-card favorites-loading">
          <div className="empty-icon">🔖</div>
          <h3>Loading your favorites...</h3>
        </div>
      ) : error ? (
        <div className="glass-card favorites-empty">
          <div className="empty-icon">⚠️</div>
          <h3>{error}</h3>
        </div>
      ) : favorites.length === 0 ? (
        <div className="glass-card favorites-empty">
          <div className="empty-icon">🔖</div>
          <h3>No saved songs yet</h3>
          <p>Click the bookmark icon (🔖) on any player to save songs here!</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((songItem) => {
            const poster = songItem.posterUrl && !songItem.posterUrl.includes("via.placeholder")
              ? songItem.posterUrl
              : (songItem.albumImage || DEFAULT_POSTER);

            return (
              <div
                key={songItem._id}
                className="favorite-card"
                onClick={() => handlePlayFavorite(songItem)}
              >
                <div className="favorite-card__poster-wrapper">
                  <img
                    src={poster}
                    alt={songItem.title}
                    onError={(e) => { e.currentTarget.src = DEFAULT_POSTER; }}
                  />
                  <div className="favorite-card__play-overlay">
                    <div className="play-icon">▶</div>
                  </div>
                </div>

                <div className="favorite-card__details">
                  <div className="favorite-card__info">
                    <span className="favorite-card__title">{songItem.title}</span>
                    <span className="favorite-card__mood">
                      {MOOD_EMOJIS[songItem.mood?.toLowerCase()]} {songItem.mood}
                    </span>
                  </div>
                  <button
                    className="favorite-card__unsave-btn"
                    onClick={(e) => handleUnsave(e, songItem._id)}
                    title="Remove from favorites"
                  >
                    🔖
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
