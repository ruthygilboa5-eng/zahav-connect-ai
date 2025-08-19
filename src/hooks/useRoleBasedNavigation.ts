import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook for enforcing role-based navigation and redirects
 */
export const useRoleBasedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();

  useEffect(() => {
    if (!authState.isAuthenticated) {
      // Not authenticated - redirect to landing page
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    const currentPath = location.pathname;
    const { role } = authState;

    // Define role-specific paths
    const mainUserOnlyPaths = [
      '/home',
      '/wakeup', 
      '/emergency',
      '/emergency-contacts',
      '/reminders',
      '/memories',
      '/games',
      '/family-board'
    ];

    const familyOnlyPaths = ['/family'];

    // Redirect based on role and current path
    if (role === 'MAIN_USER') {
      // Main user trying to access family-only paths
      if (familyOnlyPaths.includes(currentPath)) {
        navigate('/home', { replace: true });
      }
    } else if (role === 'FAMILY') {
      // Family member trying to access main user paths
      if (mainUserOnlyPaths.includes(currentPath)) {
        navigate('/family', { replace: true });
      }
    }
  }, [authState, navigate, location.pathname]);

  // Return helper functions for navigation
  const navigateToUserHome = () => {
    const targetPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    navigate(targetPath);
  };

  const canAccessPath = (path: string): boolean => {
    if (!authState.isAuthenticated) return false;
    
    const mainUserOnlyPaths = [
      '/home', '/wakeup', '/emergency', '/emergency-contacts',
      '/reminders', '/memories', '/games', '/family-board'
    ];
    
    const familyOnlyPaths = ['/family'];

    if (authState.role === 'MAIN_USER') {
      return !familyOnlyPaths.includes(path);
    } else if (authState.role === 'FAMILY') {
      return !mainUserOnlyPaths.includes(path);
    }

    return false;
  };

  return {
    navigateToUserHome,
    canAccessPath,
    currentUserRole: authState.role,
    isAuthenticated: authState.isAuthenticated
  };
};