import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

/**
 * Calls the backend AI playlist generation endpoint.
 *
 * @param {string} prompt - User playlist prompt
 * @param {number} [songCount=10] - Number of songs (5-30)
 * @returns {Promise<Object>} API response payload
 */
export const generateAiPlaylistApi = async (prompt, songCount = 10) => {
  const response = await api.post("/api/ai/generate-playlist", {
    prompt: prompt.trim(),
    songCount: Number(songCount) || 10,
  });
  return response.data;
};
