import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { auth } from '../config/firebase';
import '../styles/Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Check auth state and clear history
  useEffect(() => {
    // Clear browser history
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function() {
      window.history.pushState(null, '', window.location.href);
    };

    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });

    // Cleanup function
    return () => {
      window.onpopstate = null;
      unsubscribe();
    };
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate('/home', { replace: true });
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h1 className="main-title">RoundUp 🎯</h1>
        <div className="login-box">
          {isForgotPassword ? (
            <ForgotPasswordForm onBack={() => setIsForgotPassword(false)} />
          ) : isLogin ? (
            <>
              <LoginForm 
                onLoginSuccess={handleLoginSuccess} 
                onForgotPassword={() => setIsForgotPassword(true)}
              />
              <p className="switch-form">
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)}>Sign Up</button>
              </p>
            </>
          ) : (
            <>
              <SignupForm onSignupSuccess={handleLoginSuccess} />
              <p className="switch-form">
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)}>Login</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 