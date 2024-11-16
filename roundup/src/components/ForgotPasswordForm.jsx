import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FaCheckCircle } from 'react-icons/fa';

const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-form">
      {!success && <h2 className="form-title">Reset Password</h2>}
      {success ? (
        <div className="success-message">
          <FaCheckCircle size={50} />
          <p>Password reset link has been sent to your email.</p>
          <button onClick={onBack} className="back-btn-white">
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="forgot-password-buttons">
            <button type="submit" className="submit-btn">
              Send Reset Link
            </button>
            <button type="button" onClick={onBack} className="back-btn">
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;