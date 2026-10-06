import { useContext } from "react";
import { SongContext } from "../songContext";
import { recordHistory } from "../services/song.api";
import { getRecommendedNextTracks } from "../../search/services/spotify.api";
import { getOrMatchYouTubeTrack } from "../../search/services/youtube.api";

export const useSong = () => {
   const context = useContext(SongContext);
   const {
     loading,
     setLoading,
     song,
     setSong,
     queue,
     setQueue,
     error,
     setError,
     setSavedTime,
     setIsPlaying
   } = context;

   async function handleGetSong(mood, exclude) {
    if (!mood) return;
    if (setError) setError(null);
    setLoading(true);
    try {
      // Step 1: Use detected mood to search Spotify for ~10 songs (bypassing local DB)
      const response = await getRecommendedNextTracks({
        mood: mood,
        offset: 0,
        excludeIds: exclude ? [exclude] : []
      });

      const spotifyTracks = response?.results || [];

      if (!spotifyTracks || spotifyTracks.length === 0) {
        if (!exclude) {
          setSong(null);
          setQueue([]);
          if (setError) setError(`Could not find Spotify recommendations for "${mood}".`);
        } else {
          if (setError) setError("No other songs available for this mood.");
        }
        return;
      }

      // Step 2: Use existing YouTube matching on the primary song
      const primaryTrack = spotifyTracks[0];
      const matchedPrimary = await getOrMatchYouTubeTrack(primaryTrack);

      const playableSong = {
        ...matchedPrimary,
        _id: matchedPrimary.spotifyId || matchedPrimary.videoId || matchedPrimary._id,
        posterUrl: matchedPrimary.albumImage || matchedPrimary.posterUrl || "https://via.placeholder.com/150",
        mood: mood,
        artist: matchedPrimary.artists || matchedPrimary.artist || "Spotify Recommendation",
        artists: matchedPrimary.artists || matchedPrimary.artist || "Spotify Recommendation",
        title: matchedPrimary.title
      };

      // Step 3: Put ~10 songs into existing queue/player
      const playableQueue = spotifyTracks.map((t, idx) => {
        if (idx === 0) return playableSong;
        return {
          ...t,
          _id: t.spotifyId || t.videoId || t._id,
          posterUrl: t.albumImage || t.posterUrl || "https://via.placeholder.com/150",
          mood: mood,
          artist: t.artists || t.artist || "",
          artists: t.artists || t.artist || "",
          title: t.title
        };
      });

      if (setQueue) setQueue(playableQueue);
      if (setSavedTime) setSavedTime(0);
      if (setSong) setSong(playableSong);
      if (setIsPlaying) setIsPlaying(true);

      // Step 4: Pre-match the 2nd song with YouTube in background for instant skip
      if (playableQueue.length > 1) {
        getOrMatchYouTubeTrack(playableQueue[1]).catch(() => {});
      }

      // Step 5: Automatically record listening history
      try {
        await recordHistory(playableSong._id, mood, playableSong);
      } catch (historyErr) {
        // Continue playback gracefully
      }
    } catch(err) {
      console.error("Failed to fetch mood recommendation:", err);
      if (!exclude) {
        setSong(null);
        setQueue([]);
      }
      if (setError) setError(err?.response?.data?.message || err?.message || "Failed to find recommendations for your mood.");
    } finally {
      setLoading(false);
    }
   }

   async function handleSkipSong(mood, currentSongId) {
     return handleGetSong(mood, currentSongId);
   }

   return { loading, song, queue, error, setError, handleGetSong, handleSkipSong };
};

