import { useContext, useRef, useState, useEffect, useCallback } from "react";
import { SongContext } from "../songContext";
import useAuth from "../../auth/hook/useAuth";
import { getInteractionStatus, toggleLikeSong, toggleDislikeSong, toggleSaveSong } from "../services/song.api";
import { getOrMatchYouTubeTrack } from "../../search/services/youtube.api";
import { getRecommendedNextTracks } from "../../search/services/spotify.api";
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

const IconSpotify = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.48-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.841-.72 13.56 1.56.36.18.54.78.18 1.261zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.66-1.56.36z" />
  </svg>
);

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  neutral: "😐",
  surprised: "😮"
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0 || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getTrackId(track) {
  if (!track) return null;
  return track._id || track.spotifyId || track.videoId || track.youtubeId || track.id || null;
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
  const {
    song,
    setSong,
    queue,
    setQueue,
    loading,
    isPlaying,
    setIsPlaying,
    savedTime,
    setSavedTime,
    duration: contextDuration,
    setDuration: setContextDuration,
    searchQuery
  } = useContext(SongContext);

  const { user } = useAuth();

  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const progressRef = useRef(null);
  const expandedProgressRef = useRef(null);

  const loadedVideoIdRef = useRef(null);
  const queueRef = useRef(queue);
  const songRef = useRef(song);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(savedTime || 0);
  const durationRef = useRef(contextDuration || 0);
  const isHandlingEndedRef = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const prefetchPromiseRef = useRef(null);

  // Keep a pending restore timestamp that survives until the real player seeks to it
  const pendingRestoreTimeRef = useRef(savedTime > 0 ? savedTime : 0);

  const [currentTime, setCurrentTime] = useState(savedTime || 0);
  const [duration, setDuration] = useState(contextDuration || (song?.duration ? song.duration / 1000 : 0));
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

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    songRef.current = song;
  }, [song]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  /* ── Save Player State Helper ── */
  const saveState = useCallback((s, q, t, dur, p) => {
    try {
      if (!s) {
        localStorage.removeItem("moodify_player_state");
        return;
      }
      const data = {
        song: s,
        queue: q || [],
        savedTime: Math.max(0, Math.floor(t || 0)),
        duration: Math.max(0, Math.floor(dur || durationRef.current || 0)),
        isPlaying: Boolean(p)
      };
      localStorage.setItem("moodify_player_state", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save player state:", err);
    }
  }, []);

  /* ── Page unload / visibility change save listener ── */
  useEffect(() => {
    const handleUnload = () => {
      saveState(songRef.current, queueRef.current, currentTimeRef.current, durationRef.current, isPlayingRef.current);
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleUnload);
    };
  }, [saveState]);

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

  /* ── Intelligent Auto-Regeneration for Infinite Playlists ── */
  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMoreRef.current) {
      if (prefetchPromiseRef.current) return prefetchPromiseRef.current;
      return [];
    }
    const currentQ = queueRef.current || [];
    const currentS = songRef.current;
    if (!currentS) return [];

    isFetchingMoreRef.current = true;
    const fetchPromise = (async () => {
      try {
        let qStr = searchQuery;
        if (!qStr) {
          try {
            const raw = localStorage.getItem("moodify_search_state");
            if (raw) {
              const parsed = JSON.parse(raw);
              qStr = parsed.query || "";
            }
          } catch (e) {}
        }

        const res = await getRecommendedNextTracks({
          query: qStr,
          currentTitle: currentS.title,
          artists: currentS.artists || currentS.mood,
          mood: currentS.mood,
          offset: currentQ.length,
          excludeTitles: currentQ.map((t) => t.title),
          excludeIds: currentQ.map((t) => getTrackId(t))
        });

        const newTracks = res?.results || [];
        if (newTracks.length > 0) {
          const formatted = newTracks.map((t) => ({
            ...t,
            _id: t.spotifyId || t.videoId || t._id,
            posterUrl: t.albumImage || t.posterUrl || "https://via.placeholder.com/150",
            mood: t.artists || t.mood || "",
            title: t.title
          }));

          const existingIds = new Set(currentQ.map((t) => getTrackId(t)));
          const existingTitles = new Set(currentQ.map((t) => (t.title || "").toLowerCase().trim()));
          const uniqueNew = formatted.filter((t) => {
            const id = getTrackId(t);
            const title = (t.title || "").toLowerCase().trim();
            return !existingIds.has(id) && !existingTitles.has(title);
          });

          if (uniqueNew.length > 0) {
            // Background pre-match first new track's YouTube video for zero-lag transition
            getOrMatchYouTubeTrack(uniqueNew[0]).catch(() => {});

            const updatedQueue = [...currentQ, ...uniqueNew];
            if (setQueue) setQueue(updatedQueue);
            queueRef.current = updatedQueue;
            saveState(songRef.current, updatedQueue, currentTimeRef.current, durationRef.current, isPlayingRef.current);
            return uniqueNew;
          }
        }
        return [];
      } catch (err) {
        console.warn("Failed to fetch more recommended tracks:", err);
        return [];
      } finally {
        setTimeout(() => {
          isFetchingMoreRef.current = false;
          prefetchPromiseRef.current = null;
        }, 1200);
      }
    })();

    prefetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [searchQuery, setQueue, saveState]);

  /* ── Proactive prefetch when approaching end of queue ── */
  useEffect(() => {
    if (!song || !queue || queue.length === 0) return;
    const curId = getTrackId(song);
    const curIdx = queue.findIndex((item) => getTrackId(item) === curId);

    // If near the end (last or second to last song of queue)
    if (curIdx !== -1 && curIdx >= queue.length - 2) {
      if (!isFetchingMoreRef.current) {
        fetchMoreTracks();
      }
    }
  }, [song, queue, fetchMoreTracks]);

  /* ── Auto Next Handler ── */
  const handleAutoNext = useCallback(async () => {
    const currentQ = queueRef.current;
    const currentS = songRef.current;
    if (setIsPlaying) setIsPlaying(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    pendingRestoreTimeRef.current = 0;

    if (!currentQ || currentQ.length === 0) {
      if (onSkip) onSkip();
      return;
    }

    const curId = getTrackId(currentS);
    const curIdx = currentQ.findIndex((item) => getTrackId(item) === curId);

    let nextTrack = null;

    if (curIdx !== -1 && curIdx < currentQ.length - 1) {
      nextTrack = currentQ[curIdx + 1];
    } else {
      // Reached the end of the playlist! Fetch fresh recommendations instead of looping to 0
      const newItems = await fetchMoreTracks();
      if (newItems && newItems.length > 0) {
        nextTrack = newItems[0];
      } else {
        const fallbackQ = queueRef.current;
        nextTrack = fallbackQ && fallbackQ.length > 0 ? fallbackQ[0] : null;
      }
    }

    if (nextTrack) {
      try {
        if (setSavedTime) setSavedTime(0);
        const nextSong = await getOrMatchYouTubeTrack(nextTrack);
        setSong(formatPlayableSong(nextSong));
        if (setIsPlaying) setIsPlaying(true);
      } catch (err) {
        console.error("Auto next match error:", err);
      }
    }
  }, [setSong, onSkip, setIsPlaying, setSavedTime, fetchMoreTracks]);

  const handleAutoNextRef = useRef(handleAutoNext);
  useEffect(() => {
    handleAutoNextRef.current = handleAutoNext;
  }, [handleAutoNext]);

  /* ── Auto-resolve YouTube track if song lacks videoId ── */
  useEffect(() => {
    if (!song) return;
    const vidId = song.youtubeId || song.videoId;
    if (!vidId && (song.title || song.spotifyId)) {
      let isCancelled = false;
      getOrMatchYouTubeTrack(song).then((matched) => {
        if (!isCancelled && matched && (matched.youtubeId || matched.videoId)) {
          setSong((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              ...matched,
              videoId: matched.youtubeId || matched.videoId,
              youtubeId: matched.youtubeId || matched.videoId
            };
          });
        }
      }).catch((err) => {
        console.error("Auto YouTube match failed in player:", err);
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [song, setSong]);

  /* ── Initialize or update YouTube Player when song changes ── */
  useEffect(() => {
    if (!song) return;

    const vidId = song.youtubeId || song.videoId;

    if (ytApiReady && vidId) {
      if (loadedVideoIdRef.current === vidId && ytPlayerRef.current) {
        return;
      }

      loadedVideoIdRef.current = vidId;
      const restorePos = pendingRestoreTimeRef.current;

      if (!ytPlayerRef.current) {
        if (!ytContainerRef.current) return;
        ytContainerRef.current.innerHTML = "";
        const ytDiv = document.createElement("div");
        ytContainerRef.current.appendChild(ytDiv);

        ytPlayerRef.current = new window.YT.Player(ytDiv, {
          height: "0",
          width: "0",
          videoId: vidId,
          playerVars: {
            autoplay: isPlayingRef.current ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            start: Math.floor(restorePos > 0 ? restorePos : 0)
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(volume * 100);
              const dur = event.target.getDuration();
              if (dur && !isNaN(dur) && dur > 0) {
                setDuration(dur);
                if (setContextDuration) setContextDuration(dur);
              }
              if (restorePos > 0) {
                event.target.seekTo(restorePos, true);
                setCurrentTime(restorePos);
                currentTimeRef.current = restorePos;
                pendingRestoreTimeRef.current = 0;
              }
              if (isPlayingRef.current) {
                try {
                  event.target.playVideo();
                } catch (e) {
                  if (setIsPlaying) setIsPlaying(false);
                }
              } else {
                event.target.pauseVideo();
              }
            },
            onStateChange: (event) => {
              const dur = event.target.getDuration();
              if (dur && !isNaN(dur) && dur > 0) {
                setDuration(dur);
                if (setContextDuration) setContextDuration(dur);
              }

              if (event.data === window.YT.PlayerState.PLAYING) {
                if (pendingRestoreTimeRef.current > 0) {
                  event.target.seekTo(pendingRestoreTimeRef.current, true);
                  pendingRestoreTimeRef.current = 0;
                }
                if (setIsPlaying) setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                if (setIsPlaying) setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                if (setIsPlaying) setIsPlaying(false);
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
        ytPlayerRef.current.loadVideoById({
          videoId: vidId,
          startSeconds: Math.floor(restorePos > 0 ? restorePos : 0)
        });
        if (restorePos > 0) {
          ytPlayerRef.current.seekTo(restorePos, true);
          setCurrentTime(restorePos);
          currentTimeRef.current = restorePos;
          pendingRestoreTimeRef.current = 0;
        } else {
          setCurrentTime(0);
          currentTimeRef.current = 0;
        }
        if (isPlayingRef.current) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      }
    }
  }, [song?.youtubeId, song?.videoId, ytApiReady]);

  /* ── Sync YouTube player playback with isPlaying state ── */
  useEffect(() => {
    if (!song) return;

    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.getPlayerState === "function") {
          const state = ytPlayerRef.current.getPlayerState();
          if (isPlaying && state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
            ytPlayerRef.current.playVideo();
          } else if (!isPlaying && (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING)) {
            ytPlayerRef.current.pauseVideo();
          }
        }
      } catch (e) {}
    }
    saveState(songRef.current, queueRef.current, currentTimeRef.current, durationRef.current, isPlaying);
  }, [isPlaying, isYouTubeTrack, song, saveState, setIsPlaying]);

  /* ── Time Poller for YouTube Playback ── */
  useEffect(() => {
    let timer = null;
    if (isYouTubeTrack) {
      timer = setInterval(() => {
        try {
          if (pendingRestoreTimeRef.current > 0) {
            return;
          }
          const player = ytPlayerRef.current;
          if (player && typeof player.getCurrentTime === "function") {
            const cur = player.getCurrentTime() || 0;
            const rawDur = typeof player.getDuration === "function" ? player.getDuration() : 0;
            const dur = (rawDur && !isNaN(rawDur) && rawDur > 0) ? rawDur : (durationRef.current || (song?.duration ? song.duration / 1000 : 0));

            setCurrentTime(cur);
            currentTimeRef.current = cur;

            if (rawDur && !isNaN(rawDur) && rawDur > 0 && rawDur !== durationRef.current) {
              setDuration(rawDur);
              durationRef.current = rawDur;
              if (setContextDuration) setContextDuration(rawDur);
            }

            if (Math.floor(cur) % 2 === 0) {
              saveState(songRef.current, queueRef.current, cur, dur, isPlayingRef.current);
            }
          }
        } catch (e) {}
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isYouTubeTrack, song, saveState, setContextDuration]);

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
    if (setIsPlaying) setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

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

  /* ── Open Spotify Track ── */
  const handleOpenSpotify = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!song) return;
    const url =
      song.spotifyUrl ||
      (song.spotifyId ? `https://open.spotify.com/track/${song.spotifyId}` : null) ||
      (song.title ? `https://open.spotify.com/search/${encodeURIComponent(song.title)}` : null);
    if (url) {
      window.open(url, "_blank");
    }
  }, [song]);

  /* ── Open YouTube Track ── */
  const handleOpenYouTube = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!song) return;
    if (song.youtubeUrl) {
      window.open(song.youtubeUrl, "_blank");
      return;
    }
    const vidId = song.youtubeId || song.videoId;
    if (vidId) {
      window.open(`https://www.youtube.com/watch?v=${vidId}`, "_blank");
      return;
    }
    try {
      const matched = await getOrMatchYouTubeTrack(song);
      if (matched?.youtubeUrl) {
        window.open(matched.youtubeUrl, "_blank");
      } else if (matched?.videoId) {
        window.open(`https://www.youtube.com/watch?v=${matched.videoId}`, "_blank");
      } else if (song.title) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title)}`, "_blank");
      }
    } catch (err) {
      console.error("Open YouTube error:", err);
      if (song.title) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title)}`, "_blank");
      }
    }
  }, [song]);

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

    let nextTrack = null;

    if (curIdx !== -1 && curIdx < q.length - 1) {
      nextTrack = q[curIdx + 1];
    } else {
      // Reached the end of the playlist! Fetch fresh recommendations
      const newItems = await fetchMoreTracks();
      if (newItems && newItems.length > 0) {
        nextTrack = newItems[0];
      } else {
        const fallbackQ = queueRef.current;
        nextTrack = fallbackQ && fallbackQ.length > 0 ? fallbackQ[0] : null;
      }
    }

    if (nextTrack) {
      try {
        pendingRestoreTimeRef.current = 0;
        if (setSavedTime) setSavedTime(0);
        const nextSong = await getOrMatchYouTubeTrack(nextTrack);
        setSong(formatPlayableSong(nextSong));
        if (setIsPlaying) setIsPlaying(true);
      } catch (err) {
        console.error("Next track error:", err);
      }
    }
  }, [setSong, onSkip, setSavedTime, setIsPlaying, fetchMoreTracks]);

  /* ── Previous Track ── */
  const handlePrevTrack = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (currentTime > 3) {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(0, true);
      }
      setCurrentTime(0);
      currentTimeRef.current = 0;
      saveState(songRef.current, queueRef.current, 0, durationRef.current, isPlayingRef.current);
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
      pendingRestoreTimeRef.current = 0;
      if (setSavedTime) setSavedTime(0);
      const prevSong = await getOrMatchYouTubeTrack(rawPrev);
      setSong(formatPlayableSong(prevSong));
      if (setIsPlaying) setIsPlaying(true);
    } catch (err) {
      console.error("Prev track error:", err);
    }
  }, [currentTime, setSong, setSavedTime, setIsPlaying, saveState]);

  /* ── Skip 5 Seconds Forward ── */
  const skipForward = useCallback((e) => {
    if (e) e.stopPropagation();
    const effectiveDur = durationRef.current || (ytPlayerRef.current?.getDuration?.()) || (song?.duration ? song.duration / 1000 : 0);
    const cur = (ytPlayerRef.current?.getCurrentTime?.()) ?? currentTimeRef.current ?? 0;
    const target = effectiveDur > 0 ? Math.min(cur + 5, effectiveDur) : cur + 5;

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(target, true);
    }

    setCurrentTime(target);
    currentTimeRef.current = target;
    saveState(songRef.current, queueRef.current, target, effectiveDur, isPlayingRef.current);
  }, [song?.duration, saveState]);

  /* ── Skip 5 Seconds Backward ── */
  const skipBackward = useCallback((e) => {
    if (e) e.stopPropagation();
    const effectiveDur = durationRef.current || (ytPlayerRef.current?.getDuration?.()) || (song?.duration ? song.duration / 1000 : 0);
    const cur = (ytPlayerRef.current?.getCurrentTime?.()) ?? currentTimeRef.current ?? 0;
    const target = Math.max(cur - 5, 0);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(target, true);
    }

    setCurrentTime(target);
    currentTimeRef.current = target;
    saveState(songRef.current, queueRef.current, target, effectiveDur, isPlayingRef.current);
  }, [song?.duration, saveState]);

  /* ── Progress Bar Seeking ── */
  const handleProgressClick = useCallback(
    (e, targetRef) => {
      if (e) e.stopPropagation();
      const bar = targetRef ? targetRef.current : progressRef.current;
      const effectiveDur = durationRef.current || (ytPlayerRef.current?.getDuration?.()) || (song?.duration ? song.duration / 1000 : 0);

      if (!bar || !effectiveDur) return;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = ratio * effectiveDur;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(targetTime, true);
      }
      setCurrentTime(targetTime);
      currentTimeRef.current = targetTime;
      saveState(songRef.current, queueRef.current, targetTime, effectiveDur, isPlayingRef.current);
    },
    [song?.duration, saveState]
  );

  /* ── Volume Adjustment ── */
  const handleVolumeChange = useCallback((e) => {
    if (e) e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(val * 100);
    }
  }, []);

  /* ── Mute / Unmute ── */
  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      if (ytPlayerRef.current && ytPlayerRef.current.unMute) ytPlayerRef.current.unMute();
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && ytPlayerRef.current.mute) ytPlayerRef.current.mute();
    }
  }, [isMuted]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const posterSrc = song?.posterUrl || song?.albumImage || "https://via.placeholder.com/150";
  const songTitle = song?.title || (loading ? "Loading song..." : "No song selected");
  const songSubtext = song?.mood || song?.artists || (loading ? "Please wait" : "Detect mood");

  return (
    <>
      <div ref={ytContainerRef} style={{ display: "none" }} />

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
            <span className="player__time-label">{formatTime(currentTime)}</span>
            <div
              className="player__progress-bar"
              ref={progressRef}
              onClick={(e) => handleProgressClick(e, progressRef)}
            >
              <div className="player__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="player__time-label">{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="player__right" onClick={(e) => e.stopPropagation()}>
          {song && (
            <div className="player__links">
              <button
                type="button"
                className="player__link-btn player__link-btn--spotify"
                title="Open in Spotify"
                onClick={handleOpenSpotify}
              >
                <IconSpotify />
              </button>
              <button
                type="button"
                className="player__link-btn player__link-btn--youtube"
                title="Open in YouTube"
                onClick={handleOpenYouTube}
              >
                <IconYouTube />
              </button>
            </div>
          )}

          <div className="player__volume-wrapper">
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
              <div className="player-overlay__links">
                <button
                  type="button"
                  className="player__link-btn player__link-btn--spotify"
                  title="Open in Spotify"
                  onClick={handleOpenSpotify}
                >
                  <IconSpotify />
                </button>
                <button
                  type="button"
                  className="player__link-btn player__link-btn--youtube"
                  title="Open in YouTube"
                  onClick={handleOpenYouTube}
                >
                  <IconYouTube />
                </button>
              </div>
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
                  {queue.map((item, idx) => {
                    const itemId = getTrackId(item);
                    const activeId = getTrackId(song);
                    const isActive = itemId === activeId;
                    return (
                      <div
                        key={`${itemId || "track"}-${idx}`}
                        className={`queue-item ${isActive ? "active-queue-item" : ""}`}
                        onClick={async () => {
                          pendingRestoreTimeRef.current = 0;
                          if (setSavedTime) setSavedTime(0);
                          const matched = await getOrMatchYouTubeTrack(item);
                          setSong(formatPlayableSong(matched));
                          if (setIsPlaying) setIsPlaying(true);
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
        </div>
      )}
    </>
  );
}
