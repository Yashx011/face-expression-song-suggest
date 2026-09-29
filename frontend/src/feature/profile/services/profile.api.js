import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

export const getProfile = async () => {
    const response = await api.get('/api/profile')
    return response.data
}

export const updateProfile = async (username, profilePicture) => {
    const response = await api.patch('/api/auth/profile', { username, profilePicture })
    return response.data
}

export const updateProfilePhoto = async (file) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    const response = await api.patch('/api/auth/profile/photo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}


