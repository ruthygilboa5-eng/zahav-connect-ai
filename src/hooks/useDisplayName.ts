import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useDataProvider } from '@/providers/DataProvider';

// Returns the currently logged-in user's display name
export const useAuthDisplayName = () => {
  const { authState } = useAuth();
  const { profile } = useProfile();
  const { userProfile } = useDataProvider();

  // Priority: profile firstName -> auth firstName -> userProfile -> role fallback
  const firstName = (profile?.first_name && profile.first_name.trim()) ||
                   (authState.firstName && authState.firstName.trim()) ||
                   (userProfile?.firstName && userProfile.firstName.trim()) ||
                   (userProfile?.displayName && userProfile.displayName.trim());

  // Only use role-based fallback if no real name is available
  if (!firstName) {
    return authState.role === 'FAMILY' ? 'בן משפחה' : 'משתמש';
  }

  return firstName;
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