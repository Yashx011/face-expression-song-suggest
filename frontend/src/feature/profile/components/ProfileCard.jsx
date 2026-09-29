import React, { useState } from 'react'
import useAuth from '../../auth/hook/useAuth'

const GRADIENTS = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
]

const getDeterministicGradient = (str = '') => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % GRADIENTS.length
    return GRADIENTS[index]
}

const ProfileCard = () => {
    const { user, loading } = useAuth()
    const [imgError, setImgError] = useState(false)

    if (loading) {
        return <div className="profile-card loading">Loading profile...</div>
    }

    if (!user) {
        return <div className="profile-card error">No user details available.</div>
    }

    const authMethodLabel = user.authProvider === 'google' ? 'Google' : 'Email & Password'
    const userIdentifier = user.username || user.email || 'User'
    const avatarGradient = getDeterministicGradient(userIdentifier)
    const initial = userIdentifier.charAt(0).toUpperCase()

    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="avatar-container">
                    {user.profilePicture && !imgError ? (
                        <img 
                            src={user.profilePicture} 
                            alt={user.username} 
                            className="profile-avatar"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="avatar-placeholder" style={{ background: avatarGradient }}>
                            <svg className="avatar-svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className="avatar-badge">{initial}</span>
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h2 className="username">{user.username}</h2>
                    <p className="email">{user.email}</p>
                    <div className="auth-method-badge">
                        <span className="badge-label">Login Method</span>
                        <span className="badge-value">{authMethodLabel}</span>
                    </div>
                </div>
            </div>

            <div className="listening-stats">
                <h3 className="section-title">Listening Stats</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Songs Played</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Liked Songs</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">—</span>
                        <span className="stat-label">Current Mood</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileCard
