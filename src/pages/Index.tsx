import React, { useEffect } from 'react';
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
    } else {
      // Redirect non-authenticated users to landing page
      navigate('/', { replace: true });
    }
  }, [authState, navigate]);

  // This component just handles routing logic
  return null;
};

export default Index;
