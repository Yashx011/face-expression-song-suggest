import React, { useState } from 'react'
import { Link } from 'react-router'
import "../style/login.scss"
import FormGroup from "../components/FormGroup"
import useAuth from "../hook/useAuth"
import { useNavigate } from "react-router"
import GoogleLogin from '../components/googleLogin'
const Login = () => {
    const { loading, handleLogin,handleGoogleLogin } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    async function handleSubmit(e) {
        e.preventDefault()
        await handleLogin(username, password)
        
        navigate("/")
    }
    return (
        <main className="login">
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <FormGroup value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="username" />
                    <FormGroup value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="password" />
                    <button type="submit" className="button">{loading ? "loading..." : "Login"}</button>
                </form>
              <GoogleLogin 
    onSuccess={async (credentialResponse) => {
        try {
            await handleGoogleLogin(credentialResponse.credential)
            navigate("/")
        } catch (error) {
            console.error("Google login failed:", error)
        }
    }}
    onError={() => {
        console.log("Google login error")
    }}
/>
                <p>Don't have an account?<Link to="/register">Register</Link></p>
            </div>
        </main>
    )
}

export default Login