import { useState, useEffect, useContext, useRef } from "react";
import Navbar from "../../shared/components/Navbar";
import { searchSpotify } from "../services/spotify.api";
import { getOrMatchYouTubeTrack } from "../services/youtube.api";
import { SongContext } from "../../home/songContext";
import "../../playlists/style/playlists.scss";

const SUGGESTIONS = [
  "Boli Pyari Lage",
  "Shiddat",
  "Kesariya",
  "Tum Hi Ho",
  "Arijit Singh",
  "A.R. Rahman"
];

const SEARCH_STORAGE_KEY = "moodify_search_state";

function getTrackId(track) {
  if (!track) return null;
  return track._id || track.spotifyId || track.videoId || track.youtubeId || track.id || null;
}

export default function SearchPage() {
  const {
    song,
    setSong,
    setQueue,
    isPlaying,
    setIsPlaying,
    setSavedTime,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults
  } = useContext(SongContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const lastSearchedRef = useRef(searchQuery ? searchQuery.trim() : "");

  useEffect(() => {
    const trimmed = searchQuery.trim();

    // If query matches what's already searched and results already exist, DO NOT re-search
    if (trimmed && searchResults.length > 0 && lastSearchedRef.current === trimmed) {
      setLoading(false);
      return;
    }

    if (!trimmed) {
      setSearchResults([]);
      setError(null);
      setLoading(false);
      lastSearchedRef.current = "";
      try {
        localStorage.removeItem(SEARCH_STORAGE_KEY);
      } catch (e) {}
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchSpotify(trimmed)
        .then((data) => {
          const resTracks = data.results || [];
          setSearchResults(resTracks);
          lastSearchedRef.current = trimmed;
          setLoading(false);
          try {
            localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ query: trimmed, tracks: resTracks }));
          } catch (e) {}
        })
        .catch((err) => {
          console.error("Spotify search error:", err);
          setError(err.response?.data?.message || "Spotify API search failed");
          setSearchResults([]);
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    setLoading(false);
    lastSearchedRef.current = "";
    try {
      localStorage.removeItem(SEARCH_STORAGE_KEY);
    } catch (e) {}
  };

  const handleSuggestionClick = (item) => {
    setSearchQuery(item);
  };

  const handlePlayOrPauseTrack = async (track) => {
    const isCurrentTrack = song && getTrackId(track) === getTrackId(song);

    if (isCurrentTrack) {
      if (setIsPlaying) setIsPlaying(!isPlaying);
      return;
    }

    setPlayingId(track.spotifyId);
    try {
      const matched = await getOrMatchYouTubeTrack(track);
      
      const updatedTracks = searchResults.map((t) =>
        t.spotifyId === track.spotifyId ? matched : t
      );
      setSearchResults(updatedTracks);
      try {
        localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ query: searchQuery, tracks: updatedTracks }));
      } catch (e) {}

      const playableSong = {
        ...matched,
        _id: matched.spotifyId || matched.videoId || matched._id,
        posterUrl: matched.albumImage || matched.posterUrl,
        mood: matched.artists || matched.mood,
        title: matched.title
      };

      const playableQueue = updatedTracks.map((t) => ({
        ...t,
        _id: t.spotifyId || t.videoId || t._id,
        posterUrl: t.albumImage || t.posterUrl,
        mood: t.artists || t.mood,
        title: t.title
      }));

      if (setQueue) setQueue(playableQueue);
      if (setSavedTime) setSavedTime(0);
      if (setSong) setSong(playableSong);
      if (setIsPlaying) setIsPlaying(true);
    } catch (err) {
      console.error("Play track error:", err);
    } finally {
      setPlayingId(null);
    }
  };

  const handleOpenYouTube = async (e, track) => {
    e.stopPropagation();
    if (track.youtubeUrl) {
      window.open(track.youtubeUrl, "_blank");
      return;
    }

    try {
      const matched = await getOrMatchYouTubeTrack(track);
      if (matched?.youtubeUrl) {
        window.open(matched.youtubeUrl, "_blank");
        setSearchResults((prev) => {
          const nextTracks = prev.map((t) => (t.spotifyId === track.spotifyId ? matched : t));
          try {
            localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ query: searchQuery, tracks: nextTracks }));
          } catch (err) {}
          return nextTracks;
        });
      }
    } catch (err) {
      console.error("Open YouTube error:", err);
    }
  };

  return (
    <div className="playlists-page">
      <Navbar />
      <header className="playlists-header">
        <h1>Spotify & YouTube Search</h1>
        <p>Find tracks on Spotify and play them instantly with YouTube</p>
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto 0 auto" }}>
        <div className="search-input-box">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search tracks, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              title="Clear search"
              onClick={handleClear}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!searchQuery.trim() && (
        <div className="search-suggestions">
          <span className="suggestions-label">Popular Searches</span>
          <div className="suggestions-chips">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(item)}
              >
                🔍 {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48, marginTop: "1rem" }}>
          <h3>Searching tracks...</h3>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48, marginTop: "1rem", color: "#f87171" }}>
          <h3>{error}</h3>
        </div>
      ) : !searchQuery.trim() ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
          <h3>Enter a song, artist, or album name to search</h3>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 48, marginTop: "1rem" }}>
          <h3>No results found for "{searchQuery}"</h3>
        </div>
      ) : (
        <div className="spotify-results-list" style={{ marginTop: "1.5rem" }}>
          {searchResults.map((track) => {
            const isCurrentTrack = song && getTrackId(track) === getTrackId(song);
            const isTrackPlaying = isCurrentTrack && isPlaying;

            return (
              <div key={track.spotifyId} className="spotify-track-row">
                <div className="spotify-track-row__left">
                  {track.albumImage ? (
                    <img
                      className="spotify-track-row__poster"
                      src={track.albumImage}
                      alt={track.title}
                    />
                  ) : (
                    <div className="spotify-track-row__poster" style={{ background: "#333" }} />
                  )}
                  <div className="spotify-track-row__info">
                    <span className="spotify-track-row__title">{track.title}</span>
                    <div className="spotify-track-row__meta">
                      <span>{track.artists}</span>
                      {track.albumName && (
                        <span className="spotify-track-row__album">{track.albumName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="spotify-track-row__actions">
                  <button
                    type="button"
                    className="spotify-track-row__play-btn"
                    title={isTrackPlaying ? "Pause song" : "Play song"}
                    onClick={() => handlePlayOrPauseTrack(track)}
                    disabled={playingId === track.spotifyId}
                  >
                    {playingId === track.spotifyId ? (
                      <span style={{ fontSize: "0.75rem" }}>...</span>
                    ) : isTrackPlaying ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {track.spotifyUrl && (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spotify-track-row__spotify-btn"
                      title="Open in Spotify"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="#1DB954">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.48-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.841-.72 13.56 1.56.36.18.54.78.18 1.261zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.66-1.56.36z"/>
                      </svg>
                    </a>
                  )}

                  <a
                    href={track.youtubeUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-track-row__youtube-btn"
                    title="Open in YouTube"
                    onClick={(e) => handleOpenYouTube(e, track)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#FF0000">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
