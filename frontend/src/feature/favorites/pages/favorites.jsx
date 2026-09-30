import { useState, useEffect, useContext } from "react";
import { getSavedSongs, toggleSaveSong } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/favorites.scss";

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSong, setQueue } = useContext(SongContext);

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

  const handlePlayFavorite = (songItem) => {
    if (songItem && setSong) {
      setSong(songItem);
      if (favorites.length > 0 && setQueue) {
        setQueue(favorites);
      }
    }
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
          {favorites.map((songItem) => (
            <div
              key={songItem._id}
              className="favorite-card"
              onClick={() => handlePlayFavorite(songItem)}
            >
              <div className="favorite-card__poster-wrapper">
                <img
                  src={songItem.posterUrl || "https://via.placeholder.com/200"}
                  alt={songItem.title}
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
          ))}
        </div>
      )}
    </div>
  );
}
