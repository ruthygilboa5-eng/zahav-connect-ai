import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useDataProvider } from '@/providers/DataProvider';

// Returns the currently logged-in user's display name
export const useAuthDisplayName = () => {
  const { authState } = useAuth();
  const { profile } = useProfile();
  const { userProfile } = useDataProvider();

  // For current logged-in user
  const displayName = profile?.first_name || 
         profile?.display_name || 
         userProfile?.firstName || 
         userProfile?.displayName ||
         authState.firstName;

  // Role-based fallbacks
  if (!displayName) {
    return authState.role === 'FAMILY' ? 'בן משפחה' : 'משתמש';
  }

  return displayName;
};

// Returns the main user's display name (for context when logged in as family)
export const useMainUserDisplayName = () => {
  const { userProfile } = useDataProvider();
  
  // In mock mode, this would return the main user's name
  // For now, fallback to a default
  return userProfile?.displayName || userProfile?.firstName || 'המשתמש הראשי';
};

// Legacy hook for backwards compatibility
export const useDisplayName = useAuthDisplayName;