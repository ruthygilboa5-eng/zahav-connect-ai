import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Component that handles navigation based on auth state changes
 * Must be inside Router context
 */
export const AuthNavigationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    if (!authState.isAuthenticated) {
      // Not authenticated - don't redirect from root path, allow users to see home options
      const publicPaths = ['/', '/admin-login', '/admin-setup', '/family-auth', '/register-family-member'] as const;
      if (!publicPaths.includes(currentPath as typeof publicPaths[number])) {
        navigate('/', { replace: true });
      }
    } else {
      // Authenticated - navigate based on role, but only from root path  
      if (currentPath === '/') {
        if (authState.role === 'MAIN_USER') {
          navigate('/home', { replace: true });
        } else if (authState.role === 'FAMILY') {
          navigate('/family', { replace: true });
        } else if (authState.role === 'ADMIN') {
          navigate('/admin-dashboard', { replace: true });
        }
      }
    }
  }, [authState.isAuthenticated, authState.role, loading, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};