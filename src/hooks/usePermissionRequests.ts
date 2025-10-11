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
        console.log('loadRequests: No authenticated user');
        setRequests([]);
        return;
      }

      console.log('loadRequests: Loading requests for user:', authState.user.id, 'role:', authState.role);

      // Main user sees all requests for their family. Family members don't have SELECT on this table.
      if (authState.role === 'MAIN_USER') {
        const { data, error } = await supabase.rpc('get_permission_requests_main_user');

        console.log('loadRequests result (RPC):', { data, error });

        if (error) {
          console.error('Error loading permission requests:', error);
          toast({
            title: 'שגיאה',
            description: 'לא ניתן לטעון את בקשות ההרשאות',
            variant: 'destructive'
          });
          return;
        }

        // Transform RPC view format to internal format (+name for UI)
        const transformedRequests: FamilyPermissionRequest[] = (data as any[] || []).map((item: any) => ({
          id: item.id,
          ownerUserId: item.primary_user_id,
          familyLinkId: item.family_member_id,
          scope: item.permission_type as FamilyScope,
          status: String(item.status).toUpperCase() as 'PENDING' | 'APPROVED' | 'DECLINED',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          familyMemberName: item.family_member_name || null
        }));

        console.log('loadRequests (RPC): Transformed requests:', transformedRequests);
        setRequests(transformedRequests);
      } else {
        // Family members cannot select from permissions_requests due to RLS; keep empty array.
        console.log('loadRequests: Not a main user, clearing requests');
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated && authState.role === 'MAIN_USER') {
      loadRequests();
    }
  }, [authState.isAuthenticated, authState.role, authState.user?.id]);

  const requestPermission = async (scope: FamilyScope) => {
    if (!authState.memberId || !authState.user) return;

    try {
      // Get family_link (owner + link id) for this family member
      const { data: linkData, error: linkError } = await supabase
        .from('family_links')
        .select('owner_user_id, id')
        .eq('member_user_id', authState.user.id)
        .maybeSingle();

      if (linkError || !linkData) {
        throw new Error('לא ניתן למצוא קישור משפחה למשתמש הראשי');
      }

      // Fetch family member name + email for saving in permissions_requests
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', authState.user.id)
        .maybeSingle();
      if (profileErr) console.warn('Profile fetch warning:', profileErr.message);

      const familyMemberName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'בן משפחה';
      const familyMemberEmail = profile?.email || '';

      console.info('Creating permissions_requests row', {
        primary_user_id: linkData.owner_user_id,
        family_member_id: linkData.id,
        permission_type: scope
      });

      const { data, error } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: linkData.owner_user_id,
          family_member_id: linkData.id,
          permission_type: scope,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      const newRequest: FamilyPermissionRequest = {
        id: data.id,
        ownerUserId: data.primary_user_id,
        familyLinkId: data.family_member_id,
        scope: (data.permission_type as FamilyScope) || scope,
        status: (data.status?.toUpperCase() as 'PENDING' | 'APPROVED' | 'DECLINED') || 'PENDING',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setRequests(prev => [...prev, newRequest]);
      toast({ title: 'בקשה נשלחה', description: 'הבקשה להרשאה נשלחה למשתמש הראשי' });
      return newRequest;
    } catch (error: any) {
      console.error('Error requesting permission (permissions_requests insert failed):', error?.message || error);
      toast({ title: 'שגיאה', description: 'לא ניתן לשלוח את הבקשה להרשאה', variant: 'destructive' });
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      // Update the permission request to APPROVED (DB trigger will sync to family_members_permissions)
      const { data, error } = await supabase
        .from('permissions_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      const updatedRequest: FamilyPermissionRequest = {
        id: data.id,
        ownerUserId: data.primary_user_id,
        familyLinkId: data.family_member_id,
        scope: (data.permission_type as FamilyScope),
        status: (data.status as 'PENDING' | 'APPROVED' | 'DECLINED'),
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setRequests(prev => prev.map(req => req.id === requestId ? updatedRequest : req));
      return updatedRequest;
    } catch (error) {
      console.error('Error approving request (permissions_requests):', error);
      throw error;
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('permissions_requests')
        .update({ status: 'DECLINED' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      const updatedRequest: FamilyPermissionRequest = {
        id: data.id,
        ownerUserId: data.primary_user_id,
        familyLinkId: data.family_member_id,
        scope: (data.permission_type as FamilyScope),
        status: (data.status as 'PENDING' | 'APPROVED' | 'DECLINED'),
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setRequests(prev => prev.map(req => req.id === requestId ? updatedRequest : req));
      return updatedRequest;
    } catch (error) {
      console.error('Error declining request (permissions_requests):', error);
      throw error;
    }
  };

  const getRequestStatus = (scope: FamilyScope) => {
    if (!authState.user?.id) return 'NONE';
    
    // Check if user has approved permission in family_members_permissions
    // This would need to be checked via separate query, for now check requests
    const existingRequest = requests.find(
      req => req.scope === scope
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