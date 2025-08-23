import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { FamilyScope, ScopeStatus, FamilyActionKey } from '@/types/family';

/**
 * Hook to get the status of a specific scope for the current family member
 * Returns: APPROVED | PENDING | DECLINED | NONE
 */
export const useScopeStatus = (scope: FamilyScope | FamilyActionKey): ScopeStatus => {
  // Map action key to scope if needed
  const resolvedScope: FamilyScope = scope as FamilyScope;
  const { authState } = useAuth();
  const { familyMembers } = useFamilyProvider();
  const { getRequestStatus } = usePermissionRequests();
  
  return useMemo(() => {
    if (!authState.memberId) return 'NONE';
    
    // Check if the scope is already approved (in family member scopes)
    const currentMember = familyMembers.find(m => m.id === authState.memberId);
    if (currentMember?.scopes.includes(resolvedScope)) {
      return 'APPROVED';
    }
    
    // Check for pending/declined requests
    const requestStatus = getRequestStatus(resolvedScope);
    return requestStatus as ScopeStatus;
  }, [authState.memberId, familyMembers, resolvedScope, getRequestStatus]);
};