import React from 'react';
import { useNavigate } from 'react-router';
import ProfileCard from '../components/ProfileCard';
import Navbar from '../../shared/components/Navbar';
import '../style/profile.scss';

const ProfilePage = () => {
    const navigate = useNavigate();

    return (
        <div className="profile-page">
            <Navbar />
            <h1>User Profile</h1>
            <ProfileCard />
            <div className="profile-actions">
                <button 
                    type="button" 
                    className="edit-profile-btn" 
                    onClick={() => navigate('/profile/edit')}
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
