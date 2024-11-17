import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/Account.css';
import { storage, auth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile, updateEmail, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { AccountCircle, Edit, CheckCircle, Close } from '@mui/icons-material';
import { showToast } from '../config/firebase';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';

const Account = () => {
  const [isHovering, setIsHovering] = useState(false);
  const user = auth.currentUser;
  const [profilePic, setProfilePic] = useState(user?.photoURL || null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoadingUsername, setIsLoadingUsername] = useState(true);
  const [showUsernamePasswordPrompt, setShowUsernamePasswordPrompt] = useState(false);
  const [usernameUpdatePassword, setUsernameUpdatePassword] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Fetch existing username on component mount
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUsername(userDoc.id); // document ID is the username
        }
        setIsLoadingUsername(false);
      } catch (error) {
        console.error('Error fetching username:', error);
        setIsLoadingUsername(false);
      }
    };

    if (user) {
      fetchUsername();
    }
  }, [user]);

  const checkUsernameAvailability = async (username) => {
    const userDoc = doc(db, 'users', username);
    const docSnap = await getDoc(userDoc);
    return !docSnap.exists();
  };

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

  const handleEmailEdit = async () => {
    if (!isEditingEmail) {
      setIsEditingEmail(true);
      return;
    }

    try {
      if (!newEmail) {
        showToast('Please enter a new email address', 'error');
        return;
      }

      // First, prompt for password to reauthenticate
      setShowPasswordPrompt(true);
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'error');
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      // Reauthenticate user with their current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);
      
      // Send verification email to new address
      await sendEmailVerification(user);

      setShowPasswordPrompt(false);
      setIsEditingEmail(false);
      setCurrentPassword('');
      showToast('Verification email sent to your new email address. Please verify to complete the change.', 'success');
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, 'error');
    }
  };

  const cancelEmailEdit = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setShowVerificationInput(false);
    setVerificationCode('');
  };

  const handleUsernameChange = async (newUsername, requiresPassword = false) => {
    try {
      if (!newUsername) {
        showToast('Please enter a username', 'error');
        return;
      }

      const isAvailable = await checkUsernameAvailability(newUsername);
      if (!isAvailable) {
        showToast('Username already taken. Try something else', 'error');
        return;
      }

      if (requiresPassword) {
        setPendingUsername(newUsername);
        setShowUsernamePasswordPrompt(true);
      } else {
        await setDoc(doc(db, 'users', newUsername), {
          email: user.email,
          points: 1000,
          createdAt: new Date().toISOString(),
        });

        setUsername(newUsername);
        setNewUsername('');
        setIsEditingUsername(false);
        showToast('Username created successfully!', 'success');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      showToast('Error updating username. Please try again.', 'error');
    }
  };

  const handleUsernameSubmit = async () => {
    await handleUsernameChange(newUsername, false);
  };

  const handleUsernameEdit = async () => {
    if (!isEditingUsername) {
      setIsEditingUsername(true);
      return;
    }
    await handleUsernameChange(newUsername, true);
  };

  const handleUsernameUpdateWithPassword = async () => {
    try {
      // First reauthenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        usernameUpdatePassword
      );
      await reauthenticateWithCredential(user, credential);

      // Get the old document data first
      const oldUserDoc = await getDoc(doc(db, 'users', username));
      const oldData = oldUserDoc.data();

      // Delete old username document
      await deleteDoc(doc(db, 'users', username));

      // Create new username document with all the old data including points
      await setDoc(doc(db, 'users', pendingUsername), {
        ...oldData,
        email: user.email, // ensure email is current
        createdAt: new Date().toISOString()
      });

      setUsername(pendingUsername);
      setNewUsername('');
      setPendingUsername('');
      setUsernameUpdatePassword('');
      setShowUsernamePasswordPrompt(false);
      setIsEditingUsername(false);
      showToast('Username updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating username:', error);
      if (error.code === 'auth/wrong-password') {
        showToast('Incorrect password. Please try again.', 'error');
      } else {
        showToast('Error updating username. Please try again.', 'error');
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="account-container">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
        />
        <div className={`account-content ${isSidebarExpanded ? 'shifted' : ''}`}>
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
            <h2>{username || 'User'}</h2>
            
            <div className="username-section">
              {isLoadingUsername ? (
                <p>Loading...</p>
              ) : !username && !isEditingUsername ? (
                <div className="create-username">
                  <button 
                    className="create-username-btn"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    Create a username
                  </button>
                </div>
              ) : (
                <div className="username-display">
                  {!isEditingUsername ? (
                    <>
                      <p>@{username}</p>
                      <button 
                        className="icon-button"
                        onClick={() => setIsEditingUsername(true)}
                      >
                        <Edit className="edit-icon" />
                      </button>
                    </>
                  ) : (
                    <div className="username-edit">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                        placeholder="Enter username"
                        className="username-input"
                      />
                      <div className="username-actions">
                        <button 
                          className="icon-button"
                          onClick={username ? handleUsernameEdit : handleUsernameSubmit}
                        >
                          <CheckCircle className="check-icon" />
                        </button>
                        <button 
                          className="icon-button"
                          onClick={() => {
                            setIsEditingUsername(false);
                            setNewUsername('');
                            setPendingUsername('');
                          }}
                        >
                          <Close className="close-icon" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showUsernamePasswordPrompt && (
                    <div className="password-prompt">
                      <p>Enter your password to confirm username change</p>
                      <input
                        type="password"
                        value={usernameUpdatePassword}
                        onChange={(e) => setUsernameUpdatePassword(e.target.value)}
                        placeholder="Enter password"
                        className="password-input"
                      />
                      <div className="password-actions">
                        <button 
                          className="verify-button"
                          onClick={handleUsernameUpdateWithPassword}
                        >
                          Confirm
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={() => {
                            setShowUsernamePasswordPrompt(false);
                            setUsernameUpdatePassword('');
                            setPendingUsername('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="email-section">
              {!isEditingEmail ? (
                <div className="email-display">
                  <p>{user?.email}</p>
                  <button 
                    className="icon-button"
                    onClick={() => setIsEditingEmail(true)}
                  >
                    <Edit className="edit-icon" />
                  </button>
                </div>
              ) : (
                <div className="email-edit">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="email-input"
                  />
                  <div className="email-actions">
                    <button 
                      className="icon-button"
                      onClick={handleEmailEdit}
                    >
                      <CheckCircle className="check-icon" />
                    </button>
                    <button 
                      className="icon-button"
                      onClick={cancelEmailEdit}
                    >
                      <Close className="close-icon" />
                    </button>
                  </div>
                </div>
              )}
              
              {showPasswordPrompt && (
                <div className="password-prompt">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="password-input"
                  />
                  <div className="password-actions">
                    <button 
                      className="verify-button"
                      onClick={handlePasswordSubmit}
                    >
                      Confirm
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setCurrentPassword('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Account; 