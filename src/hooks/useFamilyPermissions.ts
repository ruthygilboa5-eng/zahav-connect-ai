import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { FamilyScope } from '@/types/family';

/**
 * Hook to get family member permissions based on their scopes
 * Returns boolean flags for each permission type
 */
export const useFamilyPermissions = () => {
  const { authState } = useAuth();
  const { canMemberPerformAction } = useFamilyProvider();

  const memberId = authState.memberId || '';
  
  const permissions = useMemo(() => {
    const canPostMedia = canMemberPerformAction(memberId, 'POST_MEDIA');
    const canSuggestReminder = canMemberPerformAction(memberId, 'SUGGEST_REMINDER');
    const canInviteGame = canMemberPerformAction(memberId, 'INVITE_GAME');
    const canChat = canMemberPerformAction(memberId, 'CHAT');
    
    return {
      canPostMedia,
      canSuggestReminder, 
      canInviteGame,
      canChat,
      // Helper to check any specific scope
      hasScope: (scope: FamilyScope) => canMemberPerformAction(memberId, scope)
    };
  }, [memberId, canMemberPerformAction]);

  return permissions;
};