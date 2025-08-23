import { useState, useEffect } from 'react';
import { FamilyPermissionRequest, FamilyScope } from '@/types/family';
import { useMockSupabase } from '@/hooks/useMockSupabase';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';

export const usePermissionRequests = () => {
  const [requests, setRequests] = useState<FamilyPermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { authState } = useAuth();
  const { familyMembers } = useFamilyProvider();
  const { createPermissionRequest, listPermissionRequests, updatePermissionRequest } = useMockSupabase();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const allRequests = await listPermissionRequests();
      setRequests(allRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const requestPermission = async (scope: FamilyScope) => {
    if (!authState.memberId || !authState.isAuthenticated) return;

    const newRequest = await createPermissionRequest({
      ownerUserId: 'main-user-id', // In real app, this would be the main user's ID
      familyLinkId: authState.memberId,
      scope,
      status: 'PENDING'
    });

    setRequests(prev => [...prev, newRequest]);
    return newRequest;
  };

  const approveRequest = async (requestId: string) => {
    const updatedRequest = await updatePermissionRequest(requestId, 'APPROVED');
    if (updatedRequest) {
      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
    }
    return updatedRequest;
  };

  const declineRequest = async (requestId: string) => {
    const updatedRequest = await updatePermissionRequest(requestId, 'DECLINED');
    if (updatedRequest) {
      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
    }
    return updatedRequest;
  };

  const getRequestStatus = (scope: FamilyScope) => {
    if (!authState.memberId) return 'NONE';
    
    const currentMember = familyMembers.find(m => m.id === authState.memberId);
    if (currentMember?.scopes.includes(scope)) return 'APPROVED';
    
    const existingRequest = requests.find(
      req => req.familyLinkId === authState.memberId && req.scope === scope
    );
    
    if (existingRequest) return existingRequest.status;
    return 'NONE';
  };

  return {
    requests,
    loading,
    requestPermission,
    approveRequest,
    declineRequest,
    getRequestStatus,
    refresh: loadRequests
  };
};