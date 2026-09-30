import { useState, useEffect, useContext } from "react";
import { getSong } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../style/playlists.scss";

const MOODS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "surprised", label: "Surprised", emoji: "😮" }
];

export default function PlaylistsPage() {
  const [activeMood, setActiveMood] = useState("happy");
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSong, setQueue } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSong(activeMood)
      .then((data) => {
        if (isMounted) {
          setPlaylistSongs(data.songs || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlaylistSongs([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeMood]);

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      if (setQueue) setQueue(playlistSongs);
      if (setSong) setSong(playlistSongs[0]);
    }
  };

  const handlePlayTrack = (track) => {
    if (track) {
      if (setQueue && playlistSongs.length > 0) setQueue(playlistSongs);
      if (setSong) setSong(track);
    }
  };

  return (
    <div className="playlists-page">
      <Navbar />
      <header className="playlists-header">
        <h1>Mood Playlists</h1>
        <p>Explore music curated for your emotions</p>
      </header>

      {/* Mood Selector Tabs */}
      <div className="mood-tabs">
        {MOODS.map((m) => (
          <button
            key={m.id}
            className={`mood-tab ${activeMood === m.id ? "active" : ""}`}
            onClick={() => setActiveMood(m.id)}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Playlist Toolbar */}
      <div className="glass-card playlist-toolbar">
        <div className="playlist-info">
          <h2>{activeMood} Playlist</h2>
          <span>{playlistSongs.length} {playlistSongs.length === 1 ? "track" : "tracks"} available</span>
        </div>
        {playlistSongs.length > 0 && (
          <button className="play-all-btn" onClick={handlePlayAll}>
            <span>▶</span>
            <span>Play All</span>
          </button>
        )}
      </div>

      {/* Track Grid */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>Loading playlist...</h3>
        </div>
      ) : playlistSongs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>No songs found in this mood playlist</h3>
        </div>
      ) : (
        <div className="playlist-tracks-grid">
          {playlistSongs.map((track) => (
            <div
              key={track._id}
              className="track-card"
              onClick={() => handlePlayTrack(track)}
              title="Click to play"
            >
              <img
                className="track-card__poster"
                src={track.posterUrl || "https://via.placeholder.com/150"}
                alt={track.title}
              />
              <div className="track-card__details">
                <span className="track-card__title">{track.title}</span>
                <span className="track-card__mood">{track.mood}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
