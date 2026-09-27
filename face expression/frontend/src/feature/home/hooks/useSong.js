import { useContext } from "react";
import { SongContext } from "../songContext";
import { getSong } from "../services/song.api";

export const useSong = () => {
   const context = useContext(SongContext)
   const {loading, setLoading, song, setSong} = context;

   async function handleGetSong(mood){
    setLoading(true)
    try {
      const data = await getSong(mood)
      setSong(data.song)
    } catch(err) {
      console.error("Failed to fetch song:", err)
    }
    setLoading(false)
   }

   return {loading, song, handleGetSong}
}
