import React from 'react'
import { useNavigate } from 'react-router'
// import EditProfile from '../components/EditProfile'
import '../style/profile.scss'

const EditProfilePage = () => {
    const navigate = useNavigate()

    return (
        <div className="profile-page">
            <div className="page-header">
                <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
                    &larr; Back to Profile
                </button>
                <h1>Edit Profile</h1>
            </div>
            <EditProfile />
        </div>
    )
}

export default EditProfilePage
