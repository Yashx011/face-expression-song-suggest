import { createBrowserRouter } from "react-router"
import Protected from "./feature/auth/components/protected"
import Login from "./feature/auth/pages/login"
import Register from "./feature/auth/pages/register"
import Home from "./feature/home/pages/home"
import ProfilePage from "./feature/profile/pages/profile"
import EditProfilePage from "./feature/profile/pages/editProfile"

const router = createBrowserRouter([
    {
        path: "/",
        element: <Protected><Home/></Protected>,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path:"/login",
        element: <Login />,
    },
    {
        path: "/profile",
        element: <Protected><ProfilePage/></Protected>,
    },
    {
        path: "/profile/edit",
        element: <Protected><EditProfilePage/></Protected>,
    }
])


export default router