// src/components/GoogleLoginButton.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './GoogleLoginButton.css';

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('🎉 Google login success:', credentialResponse);
    
    const result = await googleLogin(credentialResponse);
    
    if (result.success) {
      if (onSuccess) {
        onSuccess(result.user);
      } else {
        navigate('/'); // Redirect to home page
      }
    } else {
      if (onError) {
        onError(result.error);
      } else {
        alert('Google login failed: ' + result.error);
      }
    }
  };

  const handleGoogleError = (error) => {
    console.error('❌ Google login error:', error);
    if (onError) {
      onError('Google login failed');
    } else {
      alert('Google login failed. Please try again.');
    }
  };

  return (
    <div className="google-login-container">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        size="large"
        text="signin_with"
        shape="rectangular"
        theme="outline"
        logo_alignment="left"
      />
    </div>
  );
};

export default GoogleLoginButton;
