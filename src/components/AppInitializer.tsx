import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { PERSIST_LAST_ROUTE } from '@/config/routing';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer = ({ children }: AppInitializerProps) => {
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    // Clear last path persistence on production
    if (!PERSIST_LAST_ROUTE) {
      localStorage.removeItem('lastPath');
    }

    // Decide initial route strictly by auth state
    const session = authState.isAuthenticated;
    const role = authState.role;

    if (!session) {
      navigate('/', { replace: true });
    } else {
      navigate(role === 'MAIN_USER' ? '/home' : '/family', { replace: true });
    }
  }, []); // Run only once on mount

  return <>{children}</>;
};

export default AppInitializer;