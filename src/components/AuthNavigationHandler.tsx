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
      // Not authenticated - redirect to home unless already there or on admin-login
      if (currentPath !== '/' && currentPath !== '/admin-login') {
        navigate('/', { replace: true });
      }
    } else {
      // Authenticated - navigate based on role
      if (authState.role === 'MAIN_USER') {
        // Primary user should go to /home
        if (currentPath === '/') {
          navigate('/home', { replace: true });
        }
      } else if (authState.role === 'FAMILY') {
        // Family member should go to /family
        if (currentPath === '/') {
          navigate('/family', { replace: true });
        }
      } else if (authState.role === 'ADMIN') {
        // Admin should go to /admin-dashboard
        if (currentPath === '/' || currentPath === '/admin-login') {
          navigate('/admin-dashboard', { replace: true });
        }
      }
    }
  }, [authState.isAuthenticated, authState.role, loading, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};