import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    let unsubscribe;

    if (user) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      
      // Set up real-time listener
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setPoints(userData.points);
        }
      }, (error) => {
        console.error('Error listening to points updates:', error);
      });
    }

    // Cleanup listener on unmount or when user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <nav className="navbar">
      <div className="navbar-section">
        <div 
          className="logo"
          onClick={() => navigate('/home')}
          style={{ cursor: 'pointer' }}
        >
          ROUNDUP
        </div>
      </div>

      <div className="navbar-section center">
        <div className="points-display">
          <span className="points-label">Points:</span>
          <span className="points-value">{points.toLocaleString()}</span>
        </div>
      </div>

      <div className="navbar-section">
        {/* Empty section to maintain layout balance */}
      </div>
    </nav>
  );
};

export default Navbar;
