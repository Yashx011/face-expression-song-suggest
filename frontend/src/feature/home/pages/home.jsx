import React, { useState, useEffect, useContext } from 'react';
import FaceExpression from '../../Expression/components/faceExpression';
import Navbar from '../../shared/components/Navbar';
import { useSong } from '../hooks/useSong';
import { SongContext } from '../songContext';
import { getLikedSongs, getSavedSongs } from '../services/song.api';
import '../style/home.scss';

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊', value: 'happy', display: 'Happy 😊' },
  { label: 'Sad', emoji: '😢', value: 'sad', display: 'Sad 😢' },
  { label: 'Neutral', emoji: '😐', value: 'neutral', display: 'Neutral 😐' },
  { label: 'Surprised', emoji: '😮', value: 'surprised', display: 'Surprised 😮' }
];

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

const Home = () => {
  const { song, loading, error, handleGetSong } = useSong();
  const { setSong } = useContext(SongContext);
  const [hasDetected, setHasDetected] = useState(false);
  const [activeMood, setActiveMood] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [savedSongs, setSavedSongs] = useState([]);

  /* ── Fetch Liked & Saved Songs ── */
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getLikedSongs().catch(() => ({ songs: [] })),
      getSavedSongs().catch(() => ({ songs: [] }))
    ]).then(([likedData, savedData]) => {
      if (isMounted) {
        setLikedSongs(likedData.songs || []);
        setSavedSongs(savedData.songs || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [song?._id]);

  const handleExpressionDetected = (mood) => {
    setHasDetected(true);
    const matched = MOOD_OPTIONS.find(m => m.value === mood);
    setActiveMood(matched ? matched.value : mood);
    handleGetSong(mood);
  };

  const handleManualMoodSelect = (moodValue) => {
    setActiveMood(moodValue);
    setHasDetected(true);
    handleGetSong(moodValue);
  };

  const handleRetrySong = () => {
    if (activeMood) {
      handleGetSong(activeMood);
    }
  };

  const handlePlaySelectedSong = (selectedSong) => {
    if (selectedSong && setSong) {
      setSong(selectedSong);
    }
  };

  return (
    <div className="home-container">
      <Navbar />
      <header className="home-header">
        <h1 className="home-title">Discover music for your mood</h1>
        <p className="home-subtitle">
          Let Moodify read your expression and find a song for you.
        </p>
      </header>

      <main className="home-content">
        <div className="glass-card camera-card">
          <FaceExpression
            onExpressionDetected={handleExpressionDetected}
          />

          {hasDetected && (
            <div className="manual-mood-section">
              <span className="manual-mood-label">Not your mood?</span>
              <div className="manual-mood-buttons">
                {MOOD_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    className={`mood-btn ${activeMood === item.value ? 'active' : ''}`}
                    onClick={() => handleManualMoodSelect(item.value)}
                    disabled={loading}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card status-card">
          {loading ? (
            <div className="status-state loading-state">
              <div className="music-note-icon animated">🎵</div>
              <h3>Finding a song for your mood...</h3>
            </div>
          ) : error ? (
            <div className="status-state error-state">
              <div className="music-note-icon">⚠️</div>
              <h3>{error}</h3>
              <button
                className="retry-btn"
                onClick={handleRetrySong}
              >
                Try Again
              </button>
            </div>
          ) : song ? (
            <div className="status-state song-ready-state">
              <div className="song-badge">
                <span className="badge-dot"></span>
                Now Playing Recommendation
              </div>
              <h3 className="song-title-display">{song.title || 'Recommended Track'}</h3>
              <p className="song-artist-display">{song.artist || 'Moodify Collection'}</p>
            </div>
          ) : (
            <div className="status-state empty-state">
              <div className="music-note-icon">🎵</div>
              <h3>Detect your mood to get a song recommendation.</h3>
            </div>
          )}
        </div>
      </main>

      {/* Liked Songs Section */}
      {likedSongs.length > 0 && (
        <section className="glass-card liked-songs-section">
          <h2 className="liked-songs-title">❤️ Your Liked Songs</h2>
          <div className="liked-songs-grid">
            {likedSongs.map((likedSong) => (
              <div
                key={likedSong._id}
                className="liked-song-card"
                onClick={() => handlePlaySelectedSong(likedSong)}
                title="Click to play"
              >
                <img
                  className="liked-song-poster"
                  src={likedSong.posterUrl || "https://via.placeholder.com/150"}
                  alt={likedSong.title}
                />
                <div className="liked-song-details">
                  <span className="liked-song-title">{likedSong.title}</span>
                  <span className="liked-song-mood">
                    {MOOD_EMOJIS[likedSong.mood?.toLowerCase()]} {likedSong.mood}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Songs Section */}
      {savedSongs.length > 0 && (
        <section className="glass-card liked-songs-section">
          <h2 className="liked-songs-title">🔖 Your Saved Songs</h2>
          <div className="liked-songs-grid">
            {savedSongs.map((savedSong) => (
              <div
                key={savedSong._id}
                className="liked-song-card"
                onClick={() => handlePlaySelectedSong(savedSong)}
                title="Click to play"
              >
                <img
                  className="liked-song-poster"
                  src={savedSong.posterUrl || "https://via.placeholder.com/150"}
                  alt={savedSong.title}
                />
                <div className="liked-song-details">
                  <span className="liked-song-title">{savedSong.title}</span>
                  <span className="liked-song-mood">
                    {MOOD_EMOJIS[savedSong.mood?.toLowerCase()]} {savedSong.mood}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
