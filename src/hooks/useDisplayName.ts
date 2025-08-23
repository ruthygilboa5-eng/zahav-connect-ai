import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useDataProvider } from '@/providers/DataProvider';

export const useDisplayName = () => {
  const { authState } = useAuth();
  const { profile } = useProfile();
  const { userProfile } = useDataProvider();

  // Single source of truth for display name
  return profile?.first_name || 
         profile?.display_name || 
         userProfile?.firstName || 
         userProfile?.displayName ||
         authState.firstName || 
         'משתמש';
};