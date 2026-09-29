import { useContext } from "react"
import {AuthContext} from "../auth.context"

import {registerUser,loginUser,googleLogin,getMe,logoutUser} from "../services/auth.api"
import {updateProfile, updateProfilePhoto} from "../../profile/services/profile.api"

export default function useAuth() {
    const context = useContext(AuthContext)
    const {user,loading,setUser,setLoading} = context

    async function handleRegister(email,password,username){
        setLoading(true)
      const data = await registerUser(email,password,username)
      setUser(data.user)
      setLoading(null)

    }
    async function handleLogin(username,password){
        setLoading(true)
        const data = await loginUser(username,password)
        setUser(data.user)
        setLoading(null)
        
    }
    async function handleGoogleLogin(idToken){
        setLoading(true)
        const data = await googleLogin(idToken)
        setUser(data.user)
        setLoading(null)
        return data
    }
    async function handleGetMe(){
        setLoading(true)
        const data = await getMe()
        setUser(data.user)
        setLoading(false)

        
    }
    async function handleLogout(){
        setLoading(true)
        const data = await logoutUser()
        setUser(null)
        setLoading(false)

    }
    async function handleUpdateProfile(username, profilePicture){
        setLoading(true)
        try {
            const data = await updateProfile(username, profilePicture)
            setUser(data.user)
            setLoading(false)
            return data
        } catch (error) {
            setLoading(false)
            throw error
        }
    }
    async function handleUpdateProfilePhoto(file){
        setLoading(true)
        try {
            const data = await updateProfilePhoto(file)
            setUser(data.user)
            setLoading(false)
            return data
        } catch (error) {
            setLoading(false)
            throw error
        }
    }
    return {user,loading,handleRegister,handleLogin,handleGoogleLogin, handleGetMe, handleLogout, handleUpdateProfile, handleUpdateProfilePhoto}
}