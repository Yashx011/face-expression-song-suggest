import { useState, useEffect, useContext } from "react";
import { getAnalytics } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/analytics.scss";

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSong } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    getAnalytics()
      .then((data) => {
        if (isMounted) {
          setAnalytics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load analytics.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlaySong = (song) => {
    if (song && setSong) {
      setSong(song);
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <Navbar />
        <header className="analytics-header">
          <h1>Mood Analytics</h1>
          <p>Analyzing your listening patterns...</p>
        </header>
        <div className="glass-card analytics-loading">
          <h3>Loading analytics...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <Navbar />
        <header className="analytics-header">
          <h1>Mood Analytics</h1>
        </header>
        <div className="glass-card analytics-empty">
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  const { totalListened = 0, totalLiked = 0, mostListenedMood, moodBreakdown = {}, recentSongs = [] } = analytics || {};
  const maxMoodCount = Math.max(1, ...Object.values(moodBreakdown));

  return (
    <div className="analytics-page">
      <Navbar />
      <header className="analytics-header">
        <h1>Mood Analytics</h1>
        <p>Insights into your emotional music journey</p>
      </header>

      {/* Stats Cards */}
      <div className="analytics-stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-card__icon">🎵</div>
          <div className="stat-card__value">{totalListened}</div>
          <div className="stat-card__label">Songs Listened</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card__icon">
            {mostListenedMood ? MOOD_EMOJIS[mostListenedMood.toLowerCase()] || "✨" : "🎧"}
          </div>
          <div className="stat-card__value">
            {mostListenedMood ? mostListenedMood : "None yet"}
          </div>
          <div className="stat-card__label">Top Mood</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card__icon">❤️</div>
          <div className="stat-card__value">{totalLiked}</div>
          <div className="stat-card__label">Liked Songs</div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="glass-card analytics-section">
        <h2>Mood Breakdown</h2>
        {totalListened === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No mood history recorded yet. Start listening to see your mood breakdown!</p>
        ) : (
          <div className="mood-bar-list">
            {Object.entries(moodBreakdown).map(([mood, count]) => {
              const pct = Math.round((count / maxMoodCount) * 100);
              return (
                <div key={mood} className="mood-bar-item">
                  <div className="mood-bar-item__header">
                    <div className="mood-bar-item__label">
                      <span>{MOOD_EMOJIS[mood.toLowerCase()] || "🎵"}</span>
                      <span>{mood}</span>
                    </div>
                    <span className="mood-bar-item__count">{count} {count === 1 ? "track" : "tracks"}</span>
                  </div>
                  <div className="mood-bar-item__track">
                    <div className="mood-bar-item__fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Listened */}
      {recentSongs.length > 0 && (
        <div className="glass-card analytics-section">
          <h2>Recently Listened Tracks</h2>
          <div className="recent-list">
            {recentSongs.map((item) => (
              <div 
                key={item._id} 
                className="recent-item"
                onClick={() => item.song && handlePlaySong(item.song)}
                style={{ cursor: item.song ? "pointer" : "default" }}
                title="Click to play song"
              >
                <div className="recent-item__left">
                  <img
                    className="recent-item__poster"
                    src={item.song?.posterUrl || "https://via.placeholder.com/150"}
                    alt={item.song?.title || "Track"}
                  />
                  <div>
                    <div className="recent-item__title">{item.song?.title || "Track"}</div>
                    <div className="recent-item__mood">
                      {MOOD_EMOJIS[item.mood?.toLowerCase()]} {item.mood}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
