import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import useAuth from '../../auth/hook/useAuth'

const EditProfile = () => {
    const { user, handleUpdateProfile, handleUpdateProfilePhoto } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (user) {
            setUsername(user.username || '')
            setEmail(user.email || '')
            setPreviewUrl(user.profilePicture || '')
        }
    }, [user])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleCancel = (e) => {
        e.preventDefault()
        navigate('/profile')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            if (selectedFile) {
                await handleUpdateProfilePhoto(selectedFile)
            }
            await handleUpdateProfile(username)
            setIsExiting(true)
            setTimeout(() => {
                navigate('/profile')
            }, 120)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile')
            setSaving(false)
        }
    }


    const initial = username ? username.charAt(0).toUpperCase() : 'U'

    return (
        <div className={`edit-profile ${isExiting ? 'is-exiting' : ''}`}>
            <h2>Update Information</h2>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="form-group avatar-edit-group">
                    <label className="form-label">Profile Photo</label>
                    <div className="avatar-preview-container">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="avatar-preview-img" />
                        ) : (
                            <div className="avatar-preview-placeholder">{initial}</div>
                        )}
                        <label htmlFor="photo-upload" className="choose-photo-btn">
                            Change Photo
                        </label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="username-input" className="form-label">Username</label>
                    <input
                        id="username-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="form-input"
                        disabled={saving}
                    />
                </div>

                <div className="form-group">
                    <div className="label-with-hint">
                        <label htmlFor="email-input" className="form-label">Email Address</label>
                        <span className="readonly-hint">(Email cannot be changed)</span>
                    </div>
                    <input
                        id="email-input"
                        type="email"
                        value={email}
                        disabled
                        readOnly
                        className="form-input disabled-input"
                    />
                </div>

                <div className="form-actions">
                    <button type="button" onClick={handleCancel} className="cancel-btn" disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditProfile


