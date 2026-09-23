import { useContext } from "react"
import {AuthContext} from "../auth.context"

import {registerUser,loginUser,getMe,logoutUser} from "../services/auth.api"

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
    return {user,loading,handleRegister,handleLogin, handleGetMe, handleLogout}
}