import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to their appropriate route
    if (authState.isAuthenticated) {
      if (authState.role === 'MAIN_USER') {
        navigate('/home', { replace: true });
      } else if (authState.role === 'FAMILY') {
        navigate('/family', { replace: true });
      }
    }
  }, [authState, navigate]);

  // This should only render for non-authenticated users
  // The LandingPage will handle the actual UI
  return null;
};

export default Index;
