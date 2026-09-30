import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { SongContext } from "../songContext";
import useAuth from "../../auth/hook/useAuth";
import { getInteractionStatus, toggleLikeSong, toggleDislikeSong, toggleSaveSong } from "../services/song.api";
import "./player.scss";

/* ─── SVG Icons ─── */
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

const IconHeartOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconHeartFilled = () => (
  <svg viewBox="0 0 24 24" fill="#e879f9" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconDislikeOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4.33v6.34A2.31 2.31 0 0 1 19.67 13H17" />
  </svg>
);

const IconDislikeFilled = () => (
  <svg viewBox="0 0 24 24" fill="#f87171" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4.33v6.34A2.31 2.31 0 0 1 19.67 13H17" />
  </svg>
);

const IconBookmarkOutline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const IconBookmarkFilled = () => (
  <svg viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Player({ onSkip }) {
  const { song, setSong, queue, loading } = useContext(SongContext);
  const { user } = useAuth();

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const expandedProgressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  /* ── Current Queue Index ── */
  const currentIndex = queue && song ? queue.findIndex((s) => s._id === song._id) : -1;

  /* ── Sync audio source when song changes ── */
  useEffect(() => {
    if (audioRef.current && song?.url) {
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Autoplay prevented by browser:", err));
      setCurrentTime(0);
    }
  }, [song?.url]);

  /* ── Sync interaction status when song or user changes ── */
  useEffect(() => {
    let isMounted = true;
    if (user && song?._id) {
      getInteractionStatus(song._id)
        .then((res) => {
          if (isMounted) {
            setIsLiked(!!res?.isLiked);
            setIsDisliked(!!res?.isDisliked);
            setIsSaved(!!res?.isSaved);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLiked(false);
            setIsDisliked(false);
            setIsSaved(false);
          }
        });
    } else {
      setIsLiked(false);
      setIsDisliked(false);
      setIsSaved(false);
    }
    return () => {
      isMounted = false;
    };
  }, [song?._id, user]);

  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  /* ── Toggle Like ── */
  const handleToggleLike = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!song?._id) return;
    if (!user) {
      alert("Please log in to like songs");
      return;
    }
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    if (!prevLiked) setIsDisliked(false);

    try {
      const res = await toggleLikeSong(song._id);
      setIsLiked(!!res?.isLiked);
      setIsDisliked(!!res?.isDisliked);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setIsLiked(prevLiked);
    }
  }, [song?._id, user, isLiked]);

  /* ── Toggle Dislike ── */
  const handleToggleDislike = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!song?._id) return;
    if (!user) {
      alert("Please log in to dislike songs");
      return;
    }
    const prevDisliked = isDisliked;
    setIsDisliked(!prevDisliked);
    if (!prevDisliked) setIsLiked(false);

    try {
      const res = await toggleDislikeSong(song._id);
      setIsDisliked(!!res?.isDisliked);
      setIsLiked(!!res?.isLiked);
    } catch (err) {
      console.error("Failed to toggle dislike:", err);
      setIsDisliked(prevDisliked);
    }
  }, [song?._id, user, isDisliked]);

  /* ── Toggle Save ── */
  const handleToggleSave = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!song?._id) return;
    if (!user) {
      alert("Please log in to save songs");
      return;
    }
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      const res = await toggleSaveSong(song._id);
      setIsSaved(!!res?.isSaved);
    } catch (err) {
      console.error("Failed to toggle save:", err);
      setIsSaved(prevSaved);
    }
  }, [song?._id, user, isSaved]);

  /* ── Next Song in Queue ── */
  const handleNextTrack = useCallback((e) => {
    if (e) e.stopPropagation();
    if (queue && queue.length > 0 && currentIndex !== -1) {
      const nextIdx = (currentIndex + 1) % queue.length;
      setSong(queue[nextIdx]);
    } else if (onSkip) {
      onSkip();
    }
  }, [queue, currentIndex, setSong, onSkip]);

  /* ── Previous Song in Queue ── */
  const handlePrevTrack = useCallback((e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (queue && queue.length > 0 && currentIndex > 0) {
      setSong(queue[currentIndex - 1]);
    } else if (audio) {
      audio.currentTime = 0;
    }
  }, [queue, currentIndex, setSong]);

  const skipForward = useCallback((e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
  }, []);

  const skipBackward = useCallback((e) => {
    if (e) e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
  }, []);

  const handleProgressClick = useCallback(
    (e, targetRef) => {
      if (e) e.stopPropagation();
      const audio = audioRef.current;
      const bar = targetRef ? targetRef.current : progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  const handleVolumeChange = useCallback((e) => {
    if (e) e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
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

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  /* ── AUTO-NEXT: Automatically play next song in queue when track ends ── */
  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (queue && queue.length > 0 && currentIndex !== -1) {
      const nextIdx = (currentIndex + 1) % queue.length;
      setSong(queue[nextIdx]);
    } else if (onSkip) {
      onSkip();
    }
  }, [queue, currentIndex, setSong, onSkip]);

  const handlePlayerClick = () => {
    if (song?.url) {
      setIsExpanded(true);
    }
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  if (!song?.url) {
    return (
      <div className={`player ${loading ? "player--loading" : ""}`}>
        <audio ref={audioRef} />
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
    <>
      {/* Mini Bottom Player */}
      <div
        className={`player ${loading ? "player--loading" : ""}`}
        onClick={handlePlayerClick}
      >
        <audio
          ref={audioRef}
          src={song.url}
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
        />

        {/* LEFT SECTION */}
        <div className="player__left" onClick={(e) => e.stopPropagation()}>
          <div className="player__artwork-container" onClick={() => setIsExpanded(true)}>
            <img className="player__artwork" src={song.posterUrl} alt={song.title} />
          </div>
          <div className="player__info" onClick={() => setIsExpanded(true)}>
            <span className="player__title">{song.title}</span>
            <span className="player__mood">{song.mood}</span>
          </div>

          <div className="player__actions">
            <button
              className={`player__action-btn ${isLiked ? "active-like" : ""}`}
              onClick={handleToggleLike}
              title="Like"
            >
              {isLiked ? <IconHeartFilled /> : <IconHeartOutline />}
            </button>

            <button
              className={`player__action-btn ${isDisliked ? "active-dislike" : ""}`}
              onClick={handleToggleDislike}
              title="Dislike"
            >
              {isDisliked ? <IconDislikeFilled /> : <IconDislikeOutline />}
            </button>

            <button
              className={`player__action-btn ${isSaved ? "active-save" : ""}`}
              onClick={handleToggleSave}
              title="Save"
            >
              {isSaved ? <IconBookmarkFilled /> : <IconBookmarkOutline />}
            </button>
          </div>
        </div>

        {/* CENTER SECTION */}
        <div className="player__center" onClick={(e) => e.stopPropagation()}>
          <div className="player__controls">
            <button className="player__btn" onClick={handlePrevTrack} title="Previous">
              <IconSkipBack />
            </button>
            <button className="player__btn" onClick={skipBackward} title="Rewind 5s">
              <IconRewind5 />
            </button>
            <button className="player__btn player__btn--play" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="player__btn" onClick={skipForward} title="Forward 5s">
              <IconForward5 />
            </button>
            <button className="player__btn" onClick={handleNextTrack} title="Next">
              <IconSkipForward />
            </button>
          </div>

          <div className="player__progress">
            <div
              className="player__progress-bar"
              ref={progressRef}
              onClick={(e) => handleProgressClick(e, progressRef)}
            >
              <div className="player__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="player__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="player__right" onClick={(e) => e.stopPropagation()}>
          <button className="player__volume-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
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
            title="Volume"
          />
        </div>
      </div>

      {/* Expanded Now Playing Overlay */}
      {isExpanded && (
        <div className="player-overlay">
          <header className="player-overlay__header">
            <button
              className="close-btn"
              onClick={() => setIsExpanded(false)}
              title="Close"
            >
              ✕
            </button>
            <span className="now-playing-label">Now Playing</span>
            <div style={{ width: 42 }} />
          </header>

          <main className="player-overlay__body">
            <div className="player-overlay__artwork-wrapper">
              <img src={song.posterUrl} alt={song.title} />
            </div>

            <div className="player-overlay__meta">
              <h2 className="track-title">{song.title}</h2>
              <span className="track-mood">
                <span>{MOOD_EMOJIS[song.mood?.toLowerCase()] || "🎵"}</span>
                <span>{song.mood}</span>
              </span>
            </div>

            <div className="player-overlay__progress">
              <div
                className="progress-bar-track"
                ref={expandedProgressRef}
                onClick={(e) => handleProgressClick(e, expandedProgressRef)}
              >
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="time-indicators">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="player-overlay__controls">
              <button className="ctrl-btn" onClick={handlePrevTrack} title="Previous">
                <IconSkipBack />
              </button>
              <button className="ctrl-btn" onClick={skipBackward} title="Rewind 5s">
                <IconRewind5 />
              </button>
              <button className="ctrl-btn ctrl-btn--play" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <IconPause /> : <IconPlay />}
              </button>
              <button className="ctrl-btn" onClick={skipForward} title="Forward 5s">
                <IconForward5 />
              </button>
              <button className="ctrl-btn" onClick={handleNextTrack} title="Next">
                <IconSkipForward />
              </button>
            </div>

            {/* Queue UI */}
            {queue && queue.length > 0 && (
              <div className="player-overlay__queue">
                <div className="queue-header">
                  <span>Queue ({queue.length})</span>
                  <span>{song.mood} mood</span>
                </div>
                <div className="queue-list">
                  {queue.map((item) => {
                    const isActive = item._id === song._id;
                    return (
                      <div
                        key={item._id}
                        className={`queue-item ${isActive ? "active-queue-item" : ""}`}
                        onClick={() => setSong(item)}
                      >
                        <img
                          className="queue-item__poster"
                          src={item.posterUrl || "https://via.placeholder.com/150"}
                          alt={item.title}
                        />
                        <div className="queue-item__info">
                          <span className="queue-item__title">{item.title}</span>
                          <span className="queue-item__mood">
                            {MOOD_EMOJIS[item.mood?.toLowerCase()]} {item.mood}
                          </span>
                        </div>
                        {isActive && <span className="queue-item__indicator">▶ Playing</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          <footer className="player-overlay__footer">
            <button
              className={`player__action-btn ${isLiked ? "active-like" : ""}`}
              onClick={handleToggleLike}
              title="Like"
            >
              {isLiked ? <IconHeartFilled /> : <IconHeartOutline />}
            </button>

            <button
              className={`player__action-btn ${isDisliked ? "active-dislike" : ""}`}
              onClick={handleToggleDislike}
              title="Dislike"
            >
              {isDisliked ? <IconDislikeFilled /> : <IconDislikeOutline />}
            </button>

            <button
              className={`player__action-btn ${isSaved ? "active-save" : ""}`}
              onClick={handleToggleSave}
              title="Save"
            >
              {isSaved ? <IconBookmarkFilled /> : <IconBookmarkOutline />}
            </button>
          </footer>
        </div>
      )}
    </>
  );
}
