import { createBrowserRouter } from "react-router"
import Protected from "./feature/auth/components/protected"
import Login from "./feature/auth/pages/login"
import Register from "./feature/auth/pages/register"

const router = createBrowserRouter([
    {
        path: "/",
        element: <Protected><h1>HOMEPAGE</h1></Protected>,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path:"/login",
        element: <Login />,
    }
  
])


export default router