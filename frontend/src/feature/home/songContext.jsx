import { createContext, useState } from "react";

export const SongContext = createContext();

export const SongContextProvider = ({ children }) => {
    const [song, setSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    return (
        <SongContext.Provider
            value={{
                song,
                setSong,
                queue,
                setQueue,
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