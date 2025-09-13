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
      // Not authenticated - redirect to root from protected paths only
      const publicPaths = ['/', '/admin-login', '/admin-setup', '/family-auth', '/register-family-member'] as const;
      if (!publicPaths.includes(currentPath as typeof publicPaths[number])) {
        navigate('/', { replace: true });
      }
    }
    // Removed automatic redirection for authenticated users from root path
    // Let users stay on "/" if they want to see the main page
  }, [authState.isAuthenticated, authState.role, loading, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};