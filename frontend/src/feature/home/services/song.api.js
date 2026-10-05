import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

export async function getSong(mood, exclude) {
    let url = `/api/song?mood=${encodeURIComponent(mood)}`;
    if (exclude) {
        url += `&exclude=${encodeURIComponent(exclude)}`;
    }
    const response = await api.get(url);
    return response.data;
}

export async function toggleLikeSong(songId, songData) {
    const response = await api.post(`/api/song/like/${encodeURIComponent(songId)}`, songData);
    return response.data;
}

export async function toggleDislikeSong(songId, songData) {
    const response = await api.post(`/api/song/dislike/${encodeURIComponent(songId)}`, songData);
    return response.data;
}

export async function toggleSaveSong(songId, songData) {
    const response = await api.post(`/api/song/save/${encodeURIComponent(songId)}`, songData);
    return response.data;
}

export async function getInteractionStatus(songId) {
    const response = await api.get(`/api/song/status/${encodeURIComponent(songId)}`);
    return response.data;
}

export async function getLikedSongs() {
    const response = await api.get("/api/song/liked");
    return response.data;
}

export async function getSavedSongs() {
    const response = await api.get("/api/song/saved");
    return response.data;
}

export async function recordHistory(songId, mood) {
    const response = await api.post("/api/song/history", { songId, mood });
    return response.data;
}

export async function getHistory(limit = 50) {
    const response = await api.get(`/api/song/history?limit=${limit}`);
    return response.data;
}

export async function getAnalytics() {
    const response = await api.get("/api/song/analytics");
    return response.data;
}

export async function getUserPreferences() {
    const response = await api.get("/api/song/preferences");
    return response.data;
}