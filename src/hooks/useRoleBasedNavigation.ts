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
      // Not authenticated - allow access to home page only
      if (location.pathname !== '/' && location.pathname !== '/home' && location.pathname !== '/family') {
        navigate('/', { replace: true });
      }
      return;
    }

    const currentPath = location.pathname;
    const { role } = authState;

    // Define role-specific paths
    const mainUserOnlyPaths = [
      '/dashboard',
      '/home',
      '/wakeup', 
      '/emergency',
      '/emergency-contacts',
      '/reminders',
      '/memories',
      '/games',
      '/family-board',
      '/family-management',
      '/review'
    ];

    const familyOnlyPaths = ['/family', '/family-real', '/family-profile-real'];

    // Redirect based on role and current path
    if (role === 'MAIN_USER') {
      // Main user trying to access family-only paths
      if (familyOnlyPaths.includes(currentPath)) {
        navigate('/dashboard', { replace: true });
      }
    } else if (role === 'FAMILY') {
      // Family member trying to access main user paths
      if (mainUserOnlyPaths.includes(currentPath)) {
        // For authenticated family members (real users), redirect to /family-real
        // The navigation logic in auth components handles demo vs real routing
        navigate('/family-real', { replace: true });
      }
    }
  }, [authState, navigate, location.pathname]);

  // Return helper functions for navigation
  const navigateToUserHome = () => {
    // For authenticated family members, navigate to /family-real (not /family demo)
    const targetPath = authState.role === 'MAIN_USER' ? '/dashboard' : '/family-real';
    navigate(targetPath);
  };

  const canAccessPath = (path: string): boolean => {
    if (!authState.isAuthenticated) return false;
    
    const mainUserOnlyPaths = [
      '/dashboard', '/home', '/wakeup', '/emergency', '/emergency-contacts',
      '/reminders', '/memories', '/games', '/family-board', '/family-management', '/review'
    ];
    
    const familyOnlyPaths = ['/family', '/family-real', '/family-profile-real'];

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