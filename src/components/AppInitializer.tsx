import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useOwnerContext } from '@/providers/OwnerProvider';
import { supabase } from '@/integrations/supabase/client';
import { PERSIST_LAST_ROUTE } from '@/config/routing';
import { DEV_MODE_DEMO } from '@/config/dev';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer = ({ children }: AppInitializerProps) => {
  const navigate = useNavigate();
  const { authState, loginAsMainUser, loginAsFamily, logout } = useAuth();
  const { loadUserProfile } = useProfile();
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
          // Demo mode - use existing auth state
          if (!authState.isAuthenticated) {
            navigate('/', { replace: true });
          } else {
            // Set owner context for demo
            setOwnerUserId('demo-user');
            navigate(authState.role === 'MAIN_USER' ? '/home' : '/family', { replace: true });
          }
          setInitialized(true);
          return;
        }

        // Get current Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          logout(); // Clear any stale auth state
          navigate('/', { replace: true });
          setInitialized(true);
          return;
        }

        // Load user profile
        const profile = await loadUserProfile(session.user.id);
        
        // Determine role from profile (default to FAMILY if undefined)
        const role = profile?.role || 'FAMILY';
        
        // Set owner context
        let ownerUserId = session.user.id; // Default: user is owner of their own data
        
        if (role === 'FAMILY') {
          // For family members, try to find their approved family link
          try {
            // TODO: Implement family link lookup when family management is added
            // For now, family members manage their own data
            ownerUserId = session.user.id;
          } catch (error) {
            console.error('Error finding family link:', error);
          }
        }
        
        setOwnerUserId(ownerUserId);
        
        // Update auth state with session and role
        if (role === 'MAIN_USER') {
          loginAsMainUser(profile?.first_name || '');
        } else {
          loginAsFamily(profile?.first_name || '');
        }
        
        // Navigate to appropriate route
        navigate(role === 'MAIN_USER' ? '/home' : '/family', { replace: true });
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        logout();
        navigate('/', { replace: true });
      } finally {
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeApp();
    }
  }, [initialized, authState.isAuthenticated, loginAsMainUser, loginAsFamily, logout, loadUserProfile, navigate, setOwnerUserId]);

  // Show loading until initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;