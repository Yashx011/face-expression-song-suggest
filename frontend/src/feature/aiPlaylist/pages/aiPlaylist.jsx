import { useState, useContext, useEffect } from "react";
import Navbar from "../../shared/components/Navbar";
import { SongContext } from "../../home/songContext";
import { generateAiPlaylistApi } from "../services/aiPlaylist.api";
import "../style/aiPlaylist.scss";

const PROMPT_SUGGESTIONS = [
  { label: "🌙 Late-night coding chill", prompt: "Make me a chill Hindi playlist for late-night coding" },
  { label: "🌧️ Rainy day acoustic indie", prompt: "Acoustic indie songs for a quiet rainy afternoon" },
  { label: "⚡ Energetic workout hits", prompt: "Upbeat high-energy workout songs with driving beats" },
  { label: "☕ Cozy Sunday cafe vibes", prompt: "Mellow lo-fi and acoustic cafe background music" },
  { label: "🚗 Sunset road trip classics", prompt: "Feel-good singalong songs for a sunset road trip drive" },
];

const AI_PLAYLIST_STORAGE_KEY = "moodify_ai_playlist_state";

const getInitialAiPlaylistState = () => {
  try {
    const raw = localStorage.getItem(AI_PLAYLIST_STORAGE_KEY);
    if (!raw) return { prompt: "", songCount: 10, result: null };
    const parsed = JSON.parse(raw);
    return {
      prompt: typeof parsed.prompt === "string" ? parsed.prompt : "",
      songCount: typeof parsed.songCount === "number" && !isNaN(parsed.songCount) ? parsed.songCount : 10,
      result: parsed.result && typeof parsed.result === "object" ? parsed.result : null,
    };
  } catch (err) {
    console.error("Error reading initial AI playlist state:", err);
    return { prompt: "", songCount: 10, result: null };
  }
};

export default function AiPlaylistPage() {
  const [initialState] = useState(getInitialAiPlaylistState);
  const [prompt, setPrompt] = useState(initialState.prompt);
  const [songCount, setSongCount] = useState(initialState.songCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(initialState.result);

  const { song, setSong, setQueue, isPlaying, setIsPlaying, setSavedTime } = useContext(SongContext);

  // Persist prompt, song count, and generated playlist across page refreshes
  useEffect(() => {
    try {
      if (result || prompt.trim()) {
        localStorage.setItem(
          AI_PLAYLIST_STORAGE_KEY,
          JSON.stringify({ prompt, songCount, result })
        );
      } else {
        localStorage.removeItem(AI_PLAYLIST_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to save AI playlist state to localStorage:", err);
    }
  }, [prompt, songCount, result]);

  const handleClearPlaylist = () => {
    setResult(null);
    setError(null);
    try {
      localStorage.removeItem(AI_PLAYLIST_STORAGE_KEY);
    } catch (e) {}
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await generateAiPlaylistApi(prompt, songCount);

      if (data && data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
        setResult(data);
      } else {
        const errorMsg = data?.message || "Failed to discover tracks for this playlist prompt. Please try again.";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("AI Playlist generation error:", err);
      let serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while communicating with the AI service.";

      const isQuotaError =
        err?.response?.status === 429 ||
        serverMessage.toLowerCase().includes("quota") ||
        serverMessage.toLowerCase().includes("rate limit") ||
        serverMessage.toLowerCase().includes("resource_exhausted") ||
        serverMessage.toLowerCase().includes("429");

      if (isQuotaError) {
        serverMessage = "The AI service has temporarily reached its request limit. Please try again later.";
      }

      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTrackId = (track) => {
    if (!track) return null;
    return track._id || track.spotifyId || track.videoId || track.youtubeId || track.id || null;
  };

  const isCurrentTrack = (track) => {
    if (!song || !track) return false;
    const songId = getTrackId(song);
    const trackId = getTrackId(track);
    if (songId && trackId && songId === trackId) return true;
    if (track.videoId && (song.videoId === track.videoId || song.youtubeId === track.videoId)) return true;
    if (track.youtubeId && (song.youtubeId === track.youtubeId || song.videoId === track.youtubeId)) return true;
    if (track.spotifyId && song.spotifyId === track.spotifyId) return true;
    if (song.title && track.title && song.title.trim().toLowerCase() === track.title.trim().toLowerCase()) return true;
    return false;
  };

  const handlePlayTrack = (track) => {
    if (!track) return;

    const playable = {
      ...track,
      _id: track.spotifyId || track.videoId || track._id,
      posterUrl: track.posterUrl || track.albumImage || "https://via.placeholder.com/150",
      artists: track.artists || "",
      mood: result?.playlist?.mood || track.mood || "",
      title: track.title,
      videoId: track.videoId || track.youtubeId,
      youtubeId: track.youtubeId || track.videoId,
      url: track.youtubeUrl || track.url || "",
    };

    if (setQueue && result?.tracks) {
      setQueue(result.tracks);
    }
    if (setSavedTime) setSavedTime(0);
    if (setSong) setSong(playable);
    if (setIsPlaying) setIsPlaying(true);
  };

  const handleTrackPlayPause = (track) => {
    if (!track) return;

    if (isCurrentTrack(track)) {
      if (setIsPlaying) setIsPlaying(!isPlaying);
      return;
    }

    handlePlayTrack(track);
  };

  const handlePlayAll = () => {
    if (result?.tracks && result.tracks.length > 0) {
      handlePlayTrack(result.tracks[0]);
    }
  };

  return (
    <div className="ai-playlist-page">
      <Navbar />

      {/* Page Header */}
      <header className="ai-playlist-page__header">
        <span className="header-badge">✨ Gemini AI Powered</span>
        <h1>AI Playlist Generator</h1>
        <p>
          Describe your vibe, setting, or favorite music style. Gemini will interpret your mood
          and curate real playable tracks.
        </p>
      </header>

      {/* Input Card */}
      <section className="ai-playlist-page__form-card">
        <form onSubmit={handleGenerate}>
          <div className="input-label">
            <span>What do you feel like listening to?</span>
            <span className="char-count">{prompt.length}/2000</span>
          </div>

          <textarea
            className="prompt-textarea"
            placeholder="e.g. Make me a chill Hindi playlist for late-night coding with mellow indie and lo-fi vibes..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            maxLength={2000}
            rows={3}
          />

          {/* Prompt Suggestions */}
          <div className="prompt-suggestions">
            <span className="suggestions-title">Need inspiration? Try one of these:</span>
            <div className="suggestions-list">
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="prompt-chip"
                  onClick={() => setPrompt(item.prompt)}
                  disabled={loading}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Song Count Selector */}
          <div className="count-control-wrapper">
            <div className="count-header">
              <span className="count-label">Song Count</span>
              <span className="count-badge">{songCount} Tracks</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={songCount}
              onChange={(e) => setSongCount(Number(e.target.value))}
              className="count-slider"
              disabled={loading}
            />
            <div className="count-scale">
              <span>5 songs</span>
              <span>15 songs</span>
              <span>30 songs</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <div className="error-content">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="dismiss-btn"
                onClick={() => setError(null)}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="generate-btn"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Curating with AI...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Playlist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Results Section */}
      {result ? (
        <section className="ai-playlist-page__results">
          {/* Playlist Metadata Header Card */}
          <div className="playlist-header-card">
            <div className="playlist-top-row">
              <div className="playlist-titles">
                <h2>{result.playlist?.title || "Your AI Playlist"}</h2>
                <p>{result.playlist?.description || "Curated tracks based on your request."}</p>
              </div>

              <div className="playlist-actions">
                <button
                  type="button"
                  className="clear-playlist-btn"
                  onClick={handleClearPlaylist}
                  title="Clear generated playlist and start fresh"
                >
                  ✕ Clear
                </button>
                {result.tracks && result.tracks.length > 0 && (
                  <button
                    type="button"
                    className="play-all-btn"
                    onClick={handlePlayAll}
                    title="Play full playlist"
                  >
                    <span>▶</span>
                    <span>Play All ({result.tracks.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="playlist-badges">
              {result.playlist?.mood && (
                <span className="badge badge--mood">🎭 Mood: {result.playlist.mood}</span>
              )}
              {result.playlist?.vibe && (
                <span className="badge badge--vibe">✨ Vibe: {result.playlist.vibe}</span>
              )}
              {result.playlist?.language && (
                <span className="badge badge--lang">🌐 {result.playlist.language}</span>
              )}
              {Array.isArray(result.playlist?.genres) &&
                result.playlist.genres.slice(0, 3).map((g, i) => (
                  <span key={i} className="badge badge--genre">
                    🎵 {g}
                  </span>
                ))}
              {result.fallbackUsed && (
                <span className="badge badge--source" title="Discovered via YouTube fallback">
                  ⚡ YouTube Source
                </span>
              )}
            </div>
          </div>

          {/* Tracks List */}
          <div className="tracks-list">
            {result.tracks.map((t, index) => {
              const active = isCurrentTrack(t);
              const isTrackPlaying = active && isPlaying;
              return (
                <div
                  key={t.videoId || t.spotifyId || index}
                  className={`track-row ${active ? "is-active" : ""}`}
                >
                  <div className="track-row__left">
                    <span className="track-index">
                      {active ? (isTrackPlaying ? "🔊" : "⏸") : String(index + 1).padStart(2, "0")}
                    </span>
                    <img
                      src={t.posterUrl || t.albumImage || "https://via.placeholder.com/150"}
                      alt={t.title}
                      className="track-poster"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150";
                      }}
                    />
                    <div className="track-info">
                      <span className="track-title" title={t.title}>
                        {t.title}
                      </span>
                      <span className="track-artist" title={t.artists}>
                        {t.artists || "Unknown Artist"}
                      </span>
                    </div>
                  </div>

                  <div className="track-row__actions">
                    <button
                      type="button"
                      className={`play-btn ${isTrackPlaying ? "is-playing" : ""}`}
                      onClick={() => handleTrackPlayPause(t)}
                      title={isTrackPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
                      aria-label={isTrackPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
                    >
                      {isTrackPlaying ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      )}
                    </button>
                    {(t.youtubeUrl || t.url) && (
                      <a
                        href={t.youtubeUrl || t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                        title="Watch on YouTube"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Empty State */
        <section className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>Ready to craft your soundtrack?</h3>
          <p>
            Type a prompt above or pick a quick inspiration pill to let Gemini curate a tailored
            playlist with real tracks ready to stream.
          </p>
        </section>
      )}
    </div>
  );
}
