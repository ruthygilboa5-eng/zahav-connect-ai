import { useState, useEffect } from 'react';
import { FamilyPermissionRequest, FamilyScope } from '@/types/family';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePermissionRequests = () => {
  const [requests, setRequests] = useState<FamilyPermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { authState } = useAuth();
  const { familyMembers } = useFamilyProvider();
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (!authState.user) {
        setRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('family_permission_requests')
        .select('*')
        .eq('owner_user_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading permission requests:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את בקשות ההרשאות',
          variant: 'destructive'
        });
        return;
      }

      // Transform database format to internal format
      const transformedRequests: FamilyPermissionRequest[] = (data || []).map(item => ({
        id: item.id,
        ownerUserId: item.owner_user_id,
        familyLinkId: item.family_link_id,
        scope: item.scope as FamilyScope,
        status: item.status as 'PENDING' | 'APPROVED' | 'DECLINED',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setRequests(transformedRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const requestPermission = async (scope: FamilyScope) => {
    if (!authState.memberId || !authState.user) return;

    try {
      // Get the owner user ID from family_links table
      const { data: linkData, error: linkError } = await supabase
        .from('family_links')
        .select('owner_user_id')
        .eq('id', authState.memberId)
        .single();

      if (linkError || !linkData) {
        throw new Error('לא ניתן למצוא את בעל החשבון');
      }

      const { data, error } = await supabase
        .from('family_permission_requests')
        .insert({
          owner_user_id: linkData.owner_user_id,
          family_link_id: authState.memberId,
          scope: scope,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      const newRequest: FamilyPermissionRequest = {
        id: data.id,
        ownerUserId: data.owner_user_id,
        familyLinkId: data.family_link_id,
        scope: data.scope as FamilyScope,
        status: data.status as 'PENDING' | 'APPROVED' | 'DECLINED',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setRequests(prev => [...prev, newRequest]);
      
      toast({
        title: 'בקשה נשלחה',
        description: 'הבקשה להרשאה נשלחה למשתמש הראשי'
      });

      return newRequest;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את הבקשה להרשאה',
        variant: 'destructive'
      });
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      // Update the permission request to APPROVED
      const { data: requestData, error: updateError } = await supabase
        .from('family_permission_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Add the scope to the family member's scopes
      const { data: currentLink, error: fetchError } = await supabase
        .from('family_links')
        .select('scopes')
        .eq('id', requestData.family_link_id)
        .single();

      if (fetchError) throw fetchError;

      const newScopes = [...(currentLink.scopes || []), requestData.scope];
      const { error: scopeError } = await supabase
        .from('family_links')
        .update({ scopes: newScopes })
        .eq('id', requestData.family_link_id);

      const updatedRequest: FamilyPermissionRequest = {
        id: requestData.id,
        ownerUserId: requestData.owner_user_id,
        familyLinkId: requestData.family_link_id,
        scope: requestData.scope as FamilyScope,
        status: requestData.status as 'PENDING' | 'APPROVED' | 'DECLINED',
        createdAt: requestData.created_at,
        updatedAt: requestData.updated_at
      };

      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );

      return updatedRequest;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_permission_requests')
        .update({ status: 'DECLINED' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      const updatedRequest: FamilyPermissionRequest = {
        id: data.id,
        ownerUserId: data.owner_user_id,
        familyLinkId: data.family_link_id,
        scope: data.scope as FamilyScope,
        status: data.status as 'PENDING' | 'APPROVED' | 'DECLINED',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );

      return updatedRequest;
    } catch (error) {
      console.error('Error declining request:', error);
      throw error;
    }
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