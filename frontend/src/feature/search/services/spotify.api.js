import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true
});

export const searchSpotify = async (query) => {
  const response = await api.get("/api/spotify/search", {
    params: { q: query }
  });
  return response.data;
};
