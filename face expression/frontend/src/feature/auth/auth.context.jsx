import {createContext} from "react"
import { useSearchParams } from "react-router"
import { useState } from "react"

export const AuthContext = createContext()
export const AuthContextProvider = ({children}) => {
    const [user,setUser] = useState(null)
    const [loading, setLoading] = useState(false)

    return (
        <AuthContext.Provider value={{user,loading,setUser,setLoading}}>
            {children}
        </AuthContext.Provider>
    )
}