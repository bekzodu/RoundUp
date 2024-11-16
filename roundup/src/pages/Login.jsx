import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import '../styles/Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/home');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">RoundUp 🎯</h1>
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
  );
};

export default Login; 