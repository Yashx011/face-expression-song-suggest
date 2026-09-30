import { useState, useEffect, useContext } from "react";
import { getUserPreferences } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/preferences.scss";

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSong } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    getUserPreferences()
      .then((data) => {
        if (isMounted) {
          setPreferences(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to calculate user preferences.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayTrack = (track) => {
    if (track && setSong) {
      setSong(track);
    }
  };

  if (loading) {
    return (
      <div className="preferences-page">
        <Navbar />
        <header className="preferences-header">
          <h1>User Preferences</h1>
          <p>Calculating your musical & mood affinity...</p>
        </header>
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>Loading preferences...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preferences-page">
        <Navbar />
        <header className="preferences-header">
          <h1>User Preferences</h1>
        </header>
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  const { stats = {}, preferredMoods = [], recentTracks = [], favoriteTracks = [] } = preferences || {};

  return (
    <div className="preferences-page">
      <Navbar />
      <header className="preferences-header">
        <h1>User Preferences</h1>
        <p>Derived insights based on your listening, likes, and saves</p>
      </header>

      {/* Preferences Overview Grid */}
      <div className="preferences-grid">
        <div className="glass-card pref-stat-card">
          <div className="pref-stat-card__icon">
            {stats.primaryMood && stats.primaryMood !== "None" ? MOOD_EMOJIS[stats.primaryMood.toLowerCase()] || "✨" : "✨"}
          </div>
          <div className="pref-stat-card__value">{stats.primaryMood || "None"}</div>
          <div className="pref-stat-card__label">Primary Mood</div>
        </div>

        <div className="glass-card pref-stat-card">
          <div className="pref-stat-card__icon">❤️</div>
          <div className="pref-stat-card__value">{stats.totalLiked || 0}</div>
          <div className="pref-stat-card__label">Liked Songs</div>
        </div>

        <div className="glass-card pref-stat-card">
          <div className="pref-stat-card__icon">👎</div>
          <div className="pref-stat-card__value">{stats.totalDisliked || 0}</div>
          <div className="pref-stat-card__label">Disliked Songs</div>
        </div>

        <div className="glass-card pref-stat-card">
          <div className="pref-stat-card__icon">🔖</div>
          <div className="pref-stat-card__value">{stats.totalSaved || 0}</div>
          <div className="pref-stat-card__label">Saved Bookmarks</div>
        </div>
      </div>

      {/* Mood Affinity */}
      {preferredMoods.length > 0 && (
        <div className="glass-card pref-section">
          <h2>Mood Affinity Breakdown</h2>
          <div className="mood-affinity-list">
            {preferredMoods.map((item) => (
              <div key={item.mood} className="mood-affinity-item">
                <div className="mood-affinity-item__meta">
                  <div className="mood-affinity-item__name">
                    <span>{MOOD_EMOJIS[item.mood?.toLowerCase()] || "🎵"}</span>
                    <span>{item.mood}</span>
                  </div>
                  <span className="mood-affinity-item__percentage">{item.percentage}% affinity</span>
                </div>
                <div className="mood-affinity-item__track">
                  <div className="mood-affinity-item__fill" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Tracks */}
      {favoriteTracks.length > 0 && (
        <div className="glass-card pref-section">
          <h2>Top Liked Tracks</h2>
          <div className="tracks-horizontal-list">
            {favoriteTracks.map((track) => (
              <div
                key={track._id}
                className="track-mini-card"
                onClick={() => handlePlayTrack(track)}
                title="Click to play"
              >
                <img src={track.posterUrl || "https://via.placeholder.com/150"} alt={track.title} />
                <div>
                  <div className="title">{track.title}</div>
                  <div className="mood">{MOOD_EMOJIS[track.mood?.toLowerCase()]} {track.mood}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Tracks */}
      {recentTracks.length > 0 && (
        <div className="glass-card pref-section">
          <h2>Recent Listening Preferences</h2>
          <div className="tracks-horizontal-list">
            {recentTracks.map((track) => (
              <div
                key={track._id}
                className="track-mini-card"
                onClick={() => handlePlayTrack(track)}
                title="Click to play"
              >
                <img src={track.posterUrl || "https://via.placeholder.com/150"} alt={track.title} />
                <div>
                  <div className="title">{track.title}</div>
                  <div className="mood">{MOOD_EMOJIS[track.mood?.toLowerCase()]} {track.mood}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
