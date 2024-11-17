import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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

  const handleAccountClick = () => {
    navigate('/account');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">ROUNDUP</div>
      <div className="navbar-buttons">
        <button onClick={handleAccountClick} className="account-btn">
          <FaUser />
        </button>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
