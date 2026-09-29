import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { SongContext } from "../songContext";
import "./player.scss";

/* ─── SVG Icons (inline to avoid external deps) ─── */
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const IconSkipBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const IconSkipForward = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const IconRewind5 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">5</text>
  </svg>
);

const IconForward5 = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">5</text>
  </svg>
);

const IconVolume = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.77v6.46A4.48 4.48 0 0016.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const IconVolumeMute = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12A4.5 4.5 0 0014 8.77v2.06l2.47 2.47c.03-.1.03-.2.03-.3zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

/* ─── Helpers ─── */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ─── Player Component ─── */
export default function Player() {
  const { song, loading } = useContext(SongContext);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  /* ── Sync audio source when song changes ── */
  // Change lines 80-86 in player.jsx to:
useEffect(() => {
  if (audioRef.current && song?.url) {
    audioRef.current.load();
    // 🎵 Autoplay as soon as the song url updates
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.log("Autoplay prevented by browser:", err));
    setCurrentTime(0);
  }
}, [song?.url]);

  /* ── Play / Pause ── */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  /* ── Skip Forward / Backward 5s ── */
  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
  }, []);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
  }, []);

  /* ── Jump to start / end ── */
  const jumpToStart = useCallback(() => {
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const jumpToEnd = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration) audio.currentTime = audio.duration;
  }, []);

  /* ── Progress bar click ── */
  const handleProgressClick = useCallback(
    (e) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  /* ── Volume ── */
  const handleVolumeChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  /* ── Audio event handlers ── */
  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  /* ── Progress percentage ── */
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  /* ── No song loaded ── */
  if (!song?.url) {
    return (
      <div className={`player ${loading ? "player--loading" : ""}`}>
        <div className="player__left">
          <div className="player__artwork-container">
            <div
              className="player__artwork"
              style={{ background: "linear-gradient(135deg, #2e1065 0%, #581c87 100%)", width: "100%", height: "100%" }}
            />
          </div>
          <div className="player__info">
            <span className="player__title">
              {loading ? "Loading song..." : "No song selected"}
            </span>
            <span className="player__mood">
              {loading ? "Please wait" : "Detect mood"}
            </span>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className={`player ${loading ? "player--loading" : ""}`}>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={song.url}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />

      {/* LEFT SECTION: Poster & Info */}
      <div className="player__left">
        <div className="player__artwork-container">
          <img
            className="player__artwork"
            src={song.posterUrl}
            alt={song.title}
          />
        </div>
        <div className="player__info">
          <span className="player__title">{song.title}</span>
          <span className="player__mood">{song.mood}</span>
        </div>
      </div>

      {/* CENTER SECTION: Controls & Timeline */}
      <div className="player__center">
        <div className="player__controls">
          <button className="player__btn" onClick={skipBackward} title="Rewind 5s">
            <IconRewind5 />
          </button>
          <button className="player__btn player__btn--play" onClick={togglePlay}>
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="player__btn" onClick={skipForward} title="Forward 5s">
            <IconForward5 />
          </button>
        </div>
        <div className="player__progress">
          <div className="player__progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="player__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="player__time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Volume */}
      <div className="player__right">
        <button className="player__volume-btn" onClick={toggleMute}>
          {isMuted ? <IconVolumeMute /> : <IconVolume />}
        </button>
        <input
          className="player__volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );

}
