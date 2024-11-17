import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../styles/Account.css';
import { storage, auth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { AccountCircle } from '@mui/icons-material';
import { showToast } from '../config/firebase';

const Account = () => {
  const [isHovering, setIsHovering] = useState(false);
  const user = auth.currentUser;
  const [profilePic, setProfilePic] = useState(user?.photoURL || null);

  const handleProfilePictureUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      // If user has an existing profile picture, delete it first
      if (profilePic) {
        try {
          // Get the old file reference from the URL
          const oldFileRef = ref(storage, profilePic);
          await deleteObject(oldFileRef);
          console.log('Old profile picture deleted');
        } catch (error) {
          console.error('Error deleting old profile picture:', error);
          // Continue with upload even if delete fails
        }
      }

      const storageRef = ref(storage, `user-pfp/${user.uid}_${file.name}`);
      console.log('Storage reference created:', storageRef);

      console.log('Starting upload...');
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload result:', uploadResult);

      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);

      console.log('Updating user profile...');
      await updateProfile(user, {
        photoURL: downloadURL,
      });

      setProfilePic(downloadURL);
      showToast('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Detailed upload error:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
    }
  };

  return (
    <div className="account-container">
      <Navbar />
      <div className="account-content">
        <h1>Account Settings</h1>
        
        <div className="profile-section">
          <div 
            className="profile-picture-container"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {profilePic ? (
              <img 
                src={profilePic} 
                alt="Profile" 
                className="profile-picture circle"
              />
            ) : (
              <AccountCircle 
                className="default-avatar"
                style={{ fontSize: 100, color: '#4a90e2' }}
              />
            )}
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              style={{ display: 'none' }}
            />
            {isHovering && (
              <div className="profile-picture-overlay">
                <label htmlFor="profile-upload" className="upload-label">
                  {profilePic ? 'Update/Remove' : 'Upload'}
                </label>
              </div>
            )}
          </div>
          <h2>{user?.displayName || 'User'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Account; 