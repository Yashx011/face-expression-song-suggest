import { createBrowserRouter } from "react-router";
import Protected from "./feature/auth/components/protected";
import MainLayout from "./feature/shared/components/MainLayout";
import Login from "./feature/auth/pages/login";
import Register from "./feature/auth/pages/register";
import Home from "./feature/home/pages/home";
import ProfilePage from "./feature/profile/pages/profile";
import EditProfilePage from "./feature/profile/pages/editProfile";
import HistoryPage from "./feature/history/pages/history";
import AnalyticsPage from "./feature/analytics/pages/analytics";
import PlaylistsPage from "./feature/playlists/pages/playlists";
import FavoritesPage from "./feature/favorites/pages/favorites";
import PreferencesPage from "./feature/preferences/pages/preferences";

import SearchPage from "./feature/search/pages/search";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <Protected>
                <MainLayout />
            </Protected>
        ),
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "search",
                element: <SearchPage />
            },
            {
                path: "playlists",
                element: <PlaylistsPage />
            },
            {
                path: "favorites",
                element: <FavoritesPage />
            },
            {
                path: "preferences",
                element: <PreferencesPage />
            },
            {
                path: "profile",
                element: <ProfilePage />
            },
            {
                path: "profile/edit",
                element: <EditProfilePage />
            },
            {
                path: "history",
                element: <HistoryPage />
            },
            {
                path: "analytics",
                element: <AnalyticsPage />
            }
        ]
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/login",
        element: <Login />
    }
]);

export default router;