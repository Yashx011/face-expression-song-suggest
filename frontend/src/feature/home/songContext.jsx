import { createContext, useState } from "react";

export const SongContext = createContext();

const PLAYER_STORAGE_KEY = "moodify_player_state";
const SEARCH_STORAGE_KEY = "moodify_search_state";

const getInitialPlayerState = () => {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return { song: null, queue: [], savedTime: 0, duration: 0, isPlaying: false };
    const parsed = JSON.parse(raw);
    return {
      song: parsed.song || null,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      savedTime: typeof parsed.savedTime === "number" && !isNaN(parsed.savedTime) ? parsed.savedTime : 0,
      duration: typeof parsed.duration === "number" && !isNaN(parsed.duration) ? parsed.duration : 0,
      isPlaying: Boolean(parsed.isPlaying)
    };
  } catch (err) {
    console.error("Error reading initial player state:", err);
    return { song: null, queue: [], savedTime: 0, duration: 0, isPlaying: false };
  }
};

const getInitialSearchState = () => {
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY);
    if (!raw) return { query: "", tracks: [] };
    const parsed = JSON.parse(raw);
    return {
      query: typeof parsed.query === "string" ? parsed.query : "",
      tracks: Array.isArray(parsed.tracks) ? parsed.tracks : []
    };
  } catch (err) {
    return { query: "", tracks: [] };
  }
};

export const SongContextProvider = ({ children }) => {
    const initialState = getInitialPlayerState();
    const initialSearch = getInitialSearchState();

    const [song, setSong] = useState(initialState.song);
    const [queue, setQueue] = useState(initialState.queue);
    const [isPlaying, setIsPlaying] = useState(initialState.isPlaying);
    const [savedTime, setSavedTime] = useState(initialState.savedTime);
    const [duration, setDuration] = useState(initialState.duration);

    const [searchQuery, setSearchQuery] = useState(initialSearch.query);
    const [searchResults, setSearchResults] = useState(initialSearch.tracks);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
        <SongContext.Provider
            value={{
                song,
                setSong,
                queue,
                setQueue,
                isPlaying,
                setIsPlaying,
                savedTime,
                setSavedTime,
                duration,
                setDuration,
                searchQuery,
                setSearchQuery,
                searchResults,
                setSearchResults,
                loading,
                setLoading,
                error,
                setError
            }}    
        >
            {children}
        </SongContext.Provider>
    );
};