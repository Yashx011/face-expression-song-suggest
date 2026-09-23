import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})
export const registerUser = async (email, password, username) => {
    const response = await api.post("/api/auth/register", { email, password, username })
    return response.data
}
export const loginUser = async (username, password) => {
    const response = await api.post("/api/auth/login", { username, password })
    return response.data
}
export const getMe = async () => {
    const response = await api.get("/api/auth/get-me")
    return response.data
}
export const logoutUser = async () => {
    const response = await api.post("/api/auth/logout")
    return response.data
}