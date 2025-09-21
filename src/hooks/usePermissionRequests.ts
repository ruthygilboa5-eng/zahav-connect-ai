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
        const { data, error } = await supabase
          .from('permissions_requests')
          .select('*')
          .eq('primary_user_id', authState.user.id)
          .order('created_at', { ascending: false });

        console.log('loadRequests result:', { data, error });

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
          ownerUserId: item.primary_user_id,
          familyLinkId: item.family_member_id,
          scope: item.permission_type as FamilyScope,
          status: item.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'DECLINED',
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        console.log('loadRequests: Transformed requests:', transformedRequests);
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
    loadRequests();
  }, []);

  const requestPermission = async (scope: FamilyScope) => {
    if (!authState.memberId || !authState.user) return;

    try {
      // Get the owner user ID from family_members table
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('main_user_id, id')
        .eq('user_id', authState.user.id)
        .single();

      if (memberError || !memberData) {
        throw new Error('לא ניתן למצוא את הקשר למשתמש הראשי');
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
        primary_user_id: memberData.main_user_id,
        family_member_id: memberData.id,
        permission_type: scope
      });

      const { data, error } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: memberData.main_user_id,
          family_member_id: memberData.id,
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