import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import '../styles/Welcome.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Celebration } from '@mui/icons-material';

const Welcome = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = auth.currentUser;

  const checkUsernameAvailability = async (username) => {
    const userDoc = doc(db, 'users', username);
    const docSnap = await getDoc(userDoc);
    return !docSnap.exists();
  };

  const handleNext = async () => {
    if (step === 2) {
      if (!username) {
        setError('Please enter a username');
        return;
      }

      try {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setError('Username already taken. Try something else');
          return;
        }

        // Check if this is the admin account
        const isAdmin = user.email === 'bekzod@gmail.com' || username === 'bekzodu';

        // Create user document with username and initial points
        await setDoc(doc(db, 'users', username), {
          email: user.email,
          points: 1000,
          createdAt: new Date().toISOString(),
          isAdmin: isAdmin // Add admin status
        });

        setError('');
        setStep(3);
      } catch (error) {
        setError('Error creating username. Please try again.');
      }
    } else if (step === 3) {
      navigate('/home');
    } else {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="welcome-step"
          >
            <h1>Welcome to Roundup! 🎮</h1>
            <p>Get ready for an exciting gaming experience where skill meets reward.</p>
            <p>Join tournaments, compete with others, and win amazing prizes!</p>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="welcome-step"
          >
            <h2>Choose Your Username</h2>
            <p>This is how other players will know you.</p>
            <div className="username-input-container">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Enter username"
                className="welcome-input"
              />
              {error && <p className="error-message">{error}</p>}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="welcome-step congratulations"
          >
            <Celebration className="celebration-icon" />
            <h1>Congratulations! 🎉</h1>
            <p>Welcome to the community, @{username}!</p>
            <div className="bonus-announcement">
              <h2>You've earned a welcome bonus!</h2>
              <div className="points-display">
                <span>+1,000 Points</span>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="welcome-container">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
      <button 
        className="next-button"
        onClick={handleNext}
      >
        {step === 3 ? 'Finish' : 'Next'}
      </button>
    </div>
  );
};

export default Welcome; 