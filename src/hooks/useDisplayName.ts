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
  const [name, setName] = useState<string>('');

  // Initial synchronous guess
  const firstName = (profile?.first_name && profile.first_name.trim()) ||
                   (authState.firstName && authState.firstName.trim()) ||
                   (userProfile?.firstName && userProfile.firstName.trim()) ||
                   (userProfile?.displayName && userProfile.displayName.trim()) ||
                   (authState.user?.user_metadata?.full_name?.split(' ')[0]);

  useEffect(() => {
    if (firstName) {
      setName(firstName);
      return;
    }

    // For family members, try to load from family_links where member_user_id = auth.uid()
    const fetchFamilyName = async () => {
      try {
        if (authState.role === 'FAMILY' && authState.user?.id) {
          const { data } = await import('@/integrations/supabase/client').then(m => m.supabase
            .from('family_links')
            .select('full_name')
            .eq('member_user_id', authState.user!.id)
            .maybeSingle()
          );
          if ((data as any)?.full_name) {
            setName(((data as any).full_name as string).split(' ')[0]);
          }
        }
      } catch (_) {
        // ignore
      }
    };

    fetchFamilyName();
  }, [authState.role, authState.user?.id, firstName]);

  // Final fallback – generic
  return name || 'משתמש';
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