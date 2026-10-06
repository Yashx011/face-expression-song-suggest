import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { SongContext } from "../songContext";
import useAuth from "../../auth/hook/useAuth";
import { getInteractionStatus, toggleLikeSong, toggleDislikeSong, toggleSaveSong } from "../services/song.api";
import { getOrMatchYouTubeTrack } from "../../search/services/youtube.api";
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

function getTrackId(track) {
  if (!track) return null;
  return track._id || track.spotifyId || track.videoId || track.id || null;
}

function formatPlayableSong(track) {
  if (!track) return null;
  return {
    ...track,
    _id: getTrackId(track),
    spotifyId: track.spotifyId || track._id,
    videoId: track.videoId || track.youtubeId,
    youtubeId: track.youtubeId || track.videoId,
    posterUrl: track.posterUrl || track.albumImage || "https://via.placeholder.com/150",
    mood: track.mood || track.artists || "",
    title: track.title || ""
  };
}

export default function Player({ onSkip }) {
  const { song, setSong, queue, loading } = useContext(SongContext);
  const { user } = useAuth();

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressRef = useRef(null);
  const expandedProgressRef = useRef(null);

  const loadedVideoIdRef = useRef(null);
  const queueRef = useRef(queue);
  const songRef = useRef(song);
  const isHandlingEndedRef = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    songRef.current = song;
  }, [song]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ytApiReady, setYtApiReady] = useState(false);

  const targetVideoId = song?.youtubeId || song?.videoId;
  const isYouTubeTrack = Boolean(targetVideoId || song?.source === "youtube");
  const currentSongId = getTrackId(song);
  const currentIndex = queue && currentSongId ? queue.findIndex((s) => getTrackId(s) === currentSongId) : -1;

  /* ── Load YouTube IFrame API Script ── */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      setYtApiReady(true);
    };
  }, []);

  /* ── Auto Next Handler ── */
  const handleAutoNext = useCallback(async () => {
    const currentQ = queueRef.current;
    const currentS = songRef.current;
    setIsPlaying(false);
    setCurrentTime(0);

    if (!currentQ || currentQ.length === 0) {
      if (onSkip) onSkip();
      return;
    }

    const curId = getTrackId(currentS);
    const curIdx = currentQ.findIndex((item) => getTrackId(item) === curId);
    const nextIdx = curIdx !== -1 ? (curIdx + 1) % currentQ.length : 0;
    const rawNext = currentQ[nextIdx];

    try {
      const nextSong = await getOrMatchYouTubeTrack(rawNext);
      setSong(formatPlayableSong(nextSong));
    } catch (err) {
      console.error("Auto next match error:", err);
    }
  }, [setSong, onSkip]);

  const handleAutoNextRef = useRef(handleAutoNext);
  useEffect(() => {
    handleAutoNextRef.current = handleAutoNext;
  }, [handleAutoNext]);

  /* ── Initialize or update YouTube Player when song changes ── */
  useEffect(() => {
    if (!song) return;

    const vidId = song.youtubeId || song.videoId;
    const isYt = Boolean(vidId || song.source === "youtube");

    if (isYt && ytApiReady && vidId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Prevent same-video restart (Rule 9)
      if (loadedVideoIdRef.current === vidId) {
        return;
      }

      loadedVideoIdRef.current = vidId;

      if (!ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player("yt-player-element", {
          height: "0",
          width: "0",
          videoId: vidId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(volume * 100);
              event.target.playVideo();
              setIsPlaying(true);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (isHandlingEndedRef.current) return;
                isHandlingEndedRef.current = true;
                handleAutoNextRef.current().finally(() => {
                  setTimeout(() => {
                    isHandlingEndedRef.current = false;
                  }, 500);
                });
              }
            },
            onError: (err) => {
              console.error("YouTube playback error:", err);
              handleAutoNextRef.current();
            }
          }
        });
      } else {
        ytPlayerRef.current.loadVideoById(vidId);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
      setCurrentTime(0);
    } else if (!isYt && song.url) {
      loadedVideoIdRef.current = null;
      if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (err) {}
      }
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Autoplay prevented:", err));
        setCurrentTime(0);
      }
    }
  }, [song?.youtubeId, song?.videoId, song?.url, song?.source, ytApiReady]);

  /* ── Time Poller for YouTube Playback ── */
  useEffect(() => {
    let timer = null;
    if (isYouTubeTrack && isPlaying && ytPlayerRef.current) {
      timer = setInterval(() => {
        try {
          if (ytPlayerRef.current.getCurrentTime) {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || (song.duration ? song.duration / 1000 : 0);
            setCurrentTime(cur);
            if (dur) setDuration(dur);
          }
        } catch (e) {}
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isYouTubeTrack, isPlaying, song?.duration]);

  /* ── Sync interaction status when song or user changes ── */
  useEffect(() => {
    let isMounted = true;
    const songId = currentSongId;
    if (user && songId) {
      getInteractionStatus(songId)
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
  }, [currentSongId, user]);

  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isYouTubeTrack && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isYouTubeTrack]);

  /* ── Toggle Like ── */
  const handleToggleLike = useCallback(async (e) => {
    if (e) e.stopPropagation();
    const songId = currentSongId;
    if (!songId) return;
    if (!user) {
      alert("Please log in to like songs");
      return;
    }
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    if (!prevLiked) setIsDisliked(false);

    try {
      const res = await toggleLikeSong(songId, song);
      setIsLiked(!!res?.isLiked);
      setIsDisliked(!!res?.isDisliked);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setIsLiked(prevLiked);
    }
  }, [currentSongId, song, user, isLiked]);

  /* ── Toggle Dislike ── */
  const handleToggleDislike = useCallback(async (e) => {
    if (e) e.stopPropagation();
    const songId = currentSongId;
    if (!songId) return;
    if (!user) {
      alert("Please log in to dislike songs");
      return;
    }
    const prevDisliked = isDisliked;
    setIsDisliked(!prevDisliked);
    if (!prevDisliked) setIsLiked(false);

    try {
      const res = await toggleDislikeSong(songId, song);
      setIsDisliked(!!res?.isDisliked);
      setIsLiked(!!res?.isLiked);
    } catch (err) {
      console.error("Failed to toggle dislike:", err);
      setIsDisliked(prevDisliked);
    }
  }, [currentSongId, song, user, isDisliked]);

  /* ── Toggle Save ── */
  const handleToggleSave = useCallback(async (e) => {
    if (e) e.stopPropagation();
    const songId = currentSongId;
    if (!songId) return;
    if (!user) {
      alert("Please log in to save songs");
      return;
    }
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      const res = await toggleSaveSong(songId, song);
      setIsSaved(!!res?.isSaved);
    } catch (err) {
      console.error("Failed to toggle save:", err);
      setIsSaved(prevSaved);
    }
  }, [currentSongId, song, user, isSaved]);

  /* ── Next Track ── */
  const handleNextTrack = useCallback(async (e) => {
    if (e) e.stopPropagation();
    const q = queueRef.current;
    const s = songRef.current;
    if (!q || q.length === 0) {
      if (onSkip) onSkip();
      return;
    }

    const curId = getTrackId(s);
    const curIdx = q.findIndex((item) => getTrackId(item) === curId);
    const nextIdx = curIdx !== -1 ? (curIdx + 1) % q.length : 0;
    const rawNext = q[nextIdx];

    try {
      const nextSong = await getOrMatchYouTubeTrack(rawNext);
      setSong(formatPlayableSong(nextSong));
    } catch (err) {
      console.error("Next track error:", err);
    }
  }, [setSong, onSkip]);

  /* ── Previous Track ── */
  const handlePrevTrack = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (currentTime > 3) {
      if (isYouTubeTrack && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      return;
    }

    const q = queueRef.current;
    const s = songRef.current;
    if (!q || q.length === 0) return;

    const curId = getTrackId(s);
    const curIdx = q.findIndex((item) => getTrackId(item) === curId);
    const prevIdx = curIdx > 0 ? curIdx - 1 : 0;
    const rawPrev = q[prevIdx];

    try {
      const prevSong = await getOrMatchYouTubeTrack(rawPrev);
      setSong(formatPlayableSong(prevSong));
    } catch (err) {
      console.error("Prev track error:", err);
    }
  }, [currentTime, isYouTubeTrack, setSong]);

  /* ── Skip 5 Seconds Forward ── */
  const skipForward = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isYouTubeTrack && ytPlayerRef.current) {
      const cur = ytPlayerRef.current.getCurrentTime() || currentTime || 0;
      const dur = ytPlayerRef.current.getDuration() || duration || 0;
      const target = Math.min(cur + 5, dur);
      ytPlayerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, audioRef.current.duration || 0);
    }
  }, [isYouTubeTrack, currentTime, duration]);

  /* ── Skip 5 Seconds Backward ── */
  const skipBackward = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isYouTubeTrack && ytPlayerRef.current) {
      const cur = ytPlayerRef.current.getCurrentTime() || currentTime || 0;
      const target = Math.max(cur - 5, 0);
      ytPlayerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
    }
  }, [isYouTubeTrack, currentTime]);

  /* ── Progress Bar Seeking ── */
  const handleProgressClick = useCallback(
    (e, targetRef) => {
      if (e) e.stopPropagation();
      const bar = targetRef ? targetRef.current : progressRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = ratio * duration;

      if (isYouTubeTrack && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(targetTime, true);
        setCurrentTime(targetTime);
      } else if (audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    },
    [duration, isYouTubeTrack]
  );

  /* ── Volume Adjustment ── */
  const handleVolumeChange = useCallback((e) => {
    if (e) e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(val * 100);
    }
  }, []);

  /* ── Mute / Unmute ── */
  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.8;
      if (ytPlayerRef.current && ytPlayerRef.current.unMute) ytPlayerRef.current.unMute();
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
      if (ytPlayerRef.current && ytPlayerRef.current.mute) ytPlayerRef.current.mute();
    }
  }, [isMuted, volume]);

  const onTimeUpdate = useCallback(() => {
    if (!isYouTubeTrack && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isYouTubeTrack]);

  const onLoadedMetadata = useCallback(() => {
    if (!isYouTubeTrack && audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [isYouTubeTrack]);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const posterSrc = song?.posterUrl || song?.albumImage || "https://via.placeholder.com/150";
  const songTitle = song?.title || (loading ? "Loading song..." : "No song selected");
  const songSubtext = song?.mood || song?.artists || (loading ? "Please wait" : "Detect mood");

  return (
    <>
      <div id="yt-player-element" style={{ display: "none" }} />
      <audio
        ref={audioRef}
        src={song?.url || ""}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleAutoNext}
      />

      {/* Mini Bottom Player */}
      <div
        className={`player ${loading ? "player--loading" : ""}`}
        onClick={() => song && setIsExpanded(true)}
      >
        {/* LEFT SECTION */}
        <div className="player__left" onClick={(e) => e.stopPropagation()}>
          <div className="player__artwork-container" onClick={() => song && setIsExpanded(true)}>
            {song ? (
              <img className="player__artwork" src={posterSrc} alt={songTitle} />
            ) : (
              <div
                className="player__artwork"
                style={{ background: "linear-gradient(135deg, #2e1065 0%, #581c87 100%)", width: "100%", height: "100%" }}
              />
            )}
          </div>
          <div className="player__info" onClick={() => song && setIsExpanded(true)}>
            <span className="player__title">{songTitle}</span>
            <span className="player__mood">{songSubtext}</span>
          </div>

          {song && (
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
          )}
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
      {isExpanded && song && (
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
              <img src={posterSrc} alt={songTitle} />
            </div>

            <div className="player-overlay__meta">
              <h2 className="track-title">{songTitle}</h2>
              <span className="track-mood">
                <span>{MOOD_EMOJIS[song.mood?.toLowerCase()] || "🎵"}</span>
                <span>{songSubtext}</span>
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
                  <span>{songSubtext}</span>
                </div>
                <div className="queue-list">
                  {queue.map((item) => {
                    const itemId = getTrackId(item);
                    const activeId = getTrackId(song);
                    const isActive = itemId === activeId;
                    return (
                      <div
                        key={itemId}
                        className={`queue-item ${isActive ? "active-queue-item" : ""}`}
                        onClick={async () => {
                          const matched = await getOrMatchYouTubeTrack(item);
                          setSong(formatPlayableSong(matched));
                        }}
                      >
                        <img
                          className="queue-item__poster"
                          src={item.posterUrl || item.albumImage || "https://via.placeholder.com/150"}
                          alt={item.title}
                        />
                        <div className="queue-item__info">
                          <span className="queue-item__title">{item.title}</span>
                          <span className="queue-item__mood">
                            {MOOD_EMOJIS[item.mood?.toLowerCase()]} {item.artists || item.mood}
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
