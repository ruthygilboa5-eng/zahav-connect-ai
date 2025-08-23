import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useDataProvider } from '@/providers/DataProvider';
import { useOwnerContext } from '@/providers/OwnerProvider';
import { useState, useEffect } from 'react';

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
  const { ownerUserId } = useOwnerContext();
  const { loadUserProfile } = useProfile();
  const [ownerName, setOwnerName] = useState<string>('');

  useEffect(() => {
    const fetchOwnerName = async () => {
      if (ownerUserId) {
        const ownerProfile = await loadUserProfile(ownerUserId);
        setOwnerName(
          (ownerProfile?.first_name && ownerProfile.first_name.trim()) ||
          'המשתמש הראשי'
        );
      } else {
        setOwnerName('המשתמש הראשי');
      }
    };

    fetchOwnerName();
  }, [ownerUserId, loadUserProfile]);

  return ownerName;
};

// Legacy hook for backwards compatibility
export const useDisplayName = useAuthDisplayName;