import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true
});

export const searchSpotify = async (query, offset = 0, limit = 10) => {
  const response = await api.get("/api/spotify/search", {
    params: { q: query, offset, limit }
  });
  return response.data;
};

export const getRecommendedNextTracks = async (payload) => {
  const response = await api.post("/api/spotify/recommend-next", payload);
  return response.data;
};

