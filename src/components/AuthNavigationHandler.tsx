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
      // Not authenticated - redirect to home unless already there
      if (currentPath !== '/') {
        navigate('/', { replace: true });
      }
    } else {
      // Authenticated - navigate based on role
      if (authState.role === 'MAIN_USER') {
        // Primary user should go to /family
        if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/waiting-approval') {
          navigate('/family', { replace: true });
        }
      } else if (authState.role === 'FAMILY') {
        // Family member should go to /dashboard
        if (currentPath === '/' || currentPath === '/family' || currentPath === '/waiting-approval') {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [authState.isAuthenticated, authState.role, loading, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};