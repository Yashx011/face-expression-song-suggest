import { useState, useEffect, useContext } from "react";
import { getSong } from "../../home/services/song.api";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import "../../playlists/style/playlists.scss";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setSong, setQueue } = useContext(SongContext);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    // Fetch all default tracks (happy as fallback)
    getSong("happy")
      .then((data) => {
        if (isMounted) {
          setSongs(data.songs || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSongs([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSongs = songs.filter(
    (s) =>
      s.title?.toLowerCase().includes(query.toLowerCase()) ||
      s.mood?.toLowerCase().includes(query.toLowerCase())
  );

  const handlePlayTrack = (track) => {
    if (track) {
      if (setQueue && filteredSongs.length > 0) setQueue(filteredSongs);
      if (setSong) setSong(track);
    }
  };

  return (
    <div className="playlists-page">
      <Navbar />
      <header className="playlists-header">
        <h1>Search Music</h1>
        <p>Find tracks by title or mood</p>
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto 2rem auto" }}>
        <input
          type="text"
          placeholder="Search tracks, moods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.875rem 1.25rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: "1rem",
            outline: "none"
          }}
        />
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>Loading songs...</h3>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>No matching songs found</h3>
        </div>
      ) : (
        <div className="playlist-tracks-grid">
          {filteredSongs.map((track) => (
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
