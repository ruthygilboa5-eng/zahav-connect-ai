import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useOwnerContext } from '@/providers/OwnerProvider';
import { PERSIST_LAST_ROUTE } from '@/config/routing';
import { DEV_MODE_DEMO } from '@/config/dev';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer = ({ children }: AppInitializerProps) => {
  const { authState, loading } = useAuth();
  const { setOwnerUserId } = useOwnerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Clear last path persistence on production
      if (!PERSIST_LAST_ROUTE) {
        localStorage.removeItem('lastPath');
        localStorage.removeItem('mock_firstName');
        localStorage.removeItem('mock_profile');
        localStorage.removeItem('authState');
      }

      try {
        if (DEV_MODE_DEMO) {
          // Demo mode - load auth state but stay on current route
          if (authState.isAuthenticated) {
            // Set owner context for demo
            setOwnerUserId('demo-user');
          }
          setInitialized(true);
          return;
        }

        // For real auth, set owner context based on auth state
        if (authState.user) {
          // For now, all users manage their own data
          // Family linking will be implemented later
          setOwnerUserId(authState.user.id);
        }
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setInitialized(true);
      }
    };

    if (!loading && !initialized) {
      initializeApp();
    }
  }, [loading, initialized, authState.user, authState.isAuthenticated, setOwnerUserId]);

  // Show loading until initialization is complete
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;