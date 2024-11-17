import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SportsEsports, History, Settings, Logout, Add } from '@mui/icons-material';
import '../styles/Sidebar.css';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Sidebar = ({ isExpanded, setIsExpanded, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth.currentUser.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setCurrentUser(querySnapshot.docs[0].data());
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeft /> : <ChevronRight />}
      </button>

      <div className="sidebar-content">
        <button 
          className={`sidebar-button ${location.pathname === '/active-games' ? 'active' : ''}`}
          onClick={() => navigate('/active-games')}
        >
          <SportsEsports />
          {isExpanded && <span>Active Games</span>}
        </button>

        <button className="sidebar-button">
          <History />
          {isExpanded && <span>Past Games</span>}
        </button>

        <button 
          className={`sidebar-button ${location.pathname === '/account' ? 'active' : ''}`}
          onClick={() => navigate('/account')}
        >
          <Settings />
          {isExpanded && <span>Settings</span>}
        </button>

        {currentUser?.isAdmin && (
          <button 
            className={`sidebar-button admin-button ${location.pathname === '/admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <Add />
            {isExpanded && <span>Manage Games</span>}
          </button>
        )}

        <button 
          className="sidebar-button logout"
          onClick={handleLogout}
        >
          <Logout />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 