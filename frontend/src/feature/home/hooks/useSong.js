import { useContext } from "react";
import { SongContext } from "../songContext";
import { getSong, recordHistory } from "../services/song.api";

export const useSong = () => {
   const context = useContext(SongContext);
   const { loading, setLoading, song, setSong, queue, setQueue, error, setError } = context;

   async function handleGetSong(mood, exclude) {
    if (!mood) return;
    if (setError) setError(null);
    setLoading(true);
    try {
      const data = await getSong(mood, exclude);
      if (data && data.song) {
        setSong(data.song);
        if (data.songs && data.songs.length > 0) {
          setQueue(data.songs);
        } else {
          setQueue([data.song]);
        }
        // Automatically record listening history for logged-in user
        try {
          await recordHistory(data.song._id, mood);
        } catch (err) {
          // If user is unauthenticated or history fails, continue playing gracefully
        }
      } else {
        if (!exclude) {
          setSong(null);
          setQueue([]);
          if (setError) setError("Couldn't find a song for this mood.");
        } else {
          if (setError) setError("No other songs available for this mood.");
        }
      }
    } catch(err) {
      console.error("Failed to fetch song:", err);
      if (!exclude) {
        setSong(null);
        setQueue([]);
      }
      if (setError) setError(err?.response?.data?.message || "Something went wrong while finding your song.");
    } finally {
      setLoading(false);
    }
   }

   async function handleSkipSong(mood, currentSongId) {
     return handleGetSong(mood, currentSongId);
   }

   return { loading, song, queue, error, setError, handleGetSong, handleSkipSong };
};
