import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { FamilyScope, ScopeStatus, FamilyActionKey } from '@/types/family';

/**
 * Hook to get the status of a specific scope for the current family member
 * Uses the new permissions system
 * Returns: APPROVED | PENDING | DECLINED | NONE
 */
export const useScopeStatus = (scope: FamilyScope | FamilyActionKey): ScopeStatus => {
  // Map action key to scope if needed
  const resolvedScope: FamilyScope = scope as FamilyScope;
  const { authState } = useAuth();
  const { getPermissionStatus } = useFamilyPermissions();
  
  return useMemo(() => {
    if (!authState.user || authState.role !== 'FAMILY') return 'NONE';
    
    // Use the permission status from the unified system
    const status = getPermissionStatus(resolvedScope);
    
    // Map to our ScopeStatus
    switch (status) {
      case 'approved': return 'APPROVED';
      case 'pending': return 'PENDING';
      case 'rejected': return 'DECLINED';
      default: return 'NONE';
    }
  }, [authState.user, authState.role, resolvedScope, getPermissionStatus]);
};