import React,{useState} from 'react'
import { Link } from 'react-router'
import "../style/register.scss"
import FormGroup from "../components/FormGroup"
import useAuth from "../hook/useAuth"
import { useNavigate } from 'react-router'
const Register = () => {
    const [errors, setErrors] = useState({});

const [username, setUsername] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const navigate = useNavigate()
const {loading , handleRegister} = useAuth()
async function handleSubmit(e){
    e.preventDefault()
    try {
     await handleRegister(email,password,username )
     navigate("/")
    } catch (error) {
        console.log(error)
        setErrors(error)
    }
}
return (
    <main className="register">
      <div className="form-container">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <FormGroup type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
          <FormGroup type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <FormGroup type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <button type="submit" className="button">register</button>
        </form>
        <p>Already have an account?<Link to="/login">Login</Link></p>
      </div>
    </main>
  )
}

export default Register