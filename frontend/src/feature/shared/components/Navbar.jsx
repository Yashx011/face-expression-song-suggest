import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import useAuth from "../../auth/hook/useAuth";
import "../style/navbar.scss";

/* ── SVG Icons ── */
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconLibrary = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Navbar() {
  const { user, handleLogout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const onLogoutClick = async () => {
    closeDrawer();
    try {
      await handleLogout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const initialLetter = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <>
      <nav className="navbar">
        {/* BRAND */}
        <NavLink to="/" className="navbar__brand" onClick={closeDrawer}>
          ✨ Moodify
        </NavLink>

        {/* PRIMARY NAV LINKS */}
        <div className="navbar__links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
            title="Home"
          >
            <IconHome />
            <span className="nav-label">Home</span>
          </NavLink>

          <NavLink
            to="/playlists"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
            title="Search"
          >
            <IconSearch />
            <span className="nav-label">Search</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
            title="Library"
          >
            <IconLibrary />
            <span className="nav-label">Library</span>
          </NavLink>

          {/* USER PROFILE AVATAR BUTTON */}
          {user && (
            <button
              className="navbar__avatar-btn"
              onClick={toggleDrawer}
              title="Open profile menu"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username || "User"}
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-fallback">{initialLetter}</div>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* PROFILE SIDE DRAWER */}
      {isDrawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} />

          <aside className="drawer-panel">
            <div className="drawer-panel__header">
              <div className="user-profile-summary">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="drawer-avatar"
                  />
                ) : (
                  <div className="drawer-avatar-fallback">{initialLetter}</div>
                )}
                <div className="user-meta">
                  <span className="username">{user?.username || "User"}</span>
                  <span className="email">{user?.email || ""}</span>
                </div>
              </div>

              <button className="drawer-close-btn" onClick={closeDrawer} title="Close menu">
                ✕
              </button>
            </div>

            {/* DRAWER LINKS */}
            <div className="drawer-panel__links">
              <NavLink
                to="/profile"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>👤 Profile</span>
              </NavLink>

              <NavLink
                to="/playlists"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>🎶 Playlists</span>
              </NavLink>

              <NavLink
                to="/favorites"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>🔖 Favorites</span>
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>📜 Mood History</span>
              </NavLink>

              <NavLink
                to="/analytics"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>📊 Analytics</span>
              </NavLink>

              <NavLink
                to="/preferences"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>⚙️ Preferences</span>
              </NavLink>

              <NavLink
                to="/profile/edit"
                className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                onClick={closeDrawer}
              >
                <span>✏️ Edit Profile</span>
              </NavLink>
            </div>

            {/* DRAWER FOOTER LOGOUT */}
            <div className="drawer-panel__footer">
              <button className="logout-btn" onClick={onLogoutClick}>
                <IconLogout />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
