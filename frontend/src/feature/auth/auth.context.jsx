import { createContext, useState, useEffect } from "react"
import { getMe } from "./services/auth.api"

export const AuthContext = createContext()

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMe()
            .then((data) => {
                setUser(data.user)
            })
            .catch(() => {
                setUser(null)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, setUser, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}