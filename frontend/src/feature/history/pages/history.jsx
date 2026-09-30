import { useState, useEffect, useContext } from "react";
import { getHistory } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/history.scss";

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSong } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    getHistory(50)
      .then((data) => {
        if (isMounted) {
          setHistoryItems(data.history || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load listening history.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handlePlaySong = (song) => {
    if (song && setSong) {
      setSong(song);
    }
  };

  return (
    <div className="history-page">
      <Navbar />
      <header className="history-header">
        <h1>Mood History</h1>
        <p>Your recent mood recommendation tracks</p>
      </header>

      {loading ? (
        <div className="glass-card history-loading">
          <div className="empty-icon">🎵</div>
          <h3>Loading your mood history...</h3>
        </div>
      ) : error ? (
        <div className="glass-card history-empty">
          <div className="empty-icon">⚠️</div>
          <h3>{error}</h3>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="glass-card history-empty">
          <div className="empty-icon">🎧</div>
          <h3>No mood history yet</h3>
          <p>Detect your expression on the Home page to get music recommendations!</p>
        </div>
      ) : (
        <div className="history-list">
          {historyItems.map((item) => (
            <div 
              key={item._id} 
              className="history-item"
              onClick={() => item.song && handlePlaySong(item.song)}
              style={{ cursor: item.song ? "pointer" : "default" }}
              title="Click to play song"
            >
              <div className="history-item__left">
                <img
                  className="history-item__poster"
                  src={item.song?.posterUrl || "https://via.placeholder.com/150"}
                  alt={item.song?.title || "Track"}
                />
                <div className="history-item__info">
                  <span className="history-item__title">
                    {item.song?.title || "Unknown Track"}
                  </span>
                  <span className="history-item__mood-badge">
                    <span>{MOOD_EMOJIS[item.mood?.toLowerCase()] || "🎵"}</span>
                    <span>{item.mood}</span>
                  </span>
                </div>
              </div>
              <div className="history-item__time">
                {formatDate(item.listenedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
