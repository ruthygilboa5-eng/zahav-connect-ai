import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface PermissionRequest {
  id: string;
  family_member_id: string;
  feature: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface PermissionRequestWithStatus {
  id: string;
  family_member_id: string;
  feature: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const useFamilyPermissions = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRequestWithStatus[]>([]);
  const [allRequests, setAllRequests] = useState<PermissionRequestWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all permission requests for current family member (all statuses)
  const loadPermissions = async () => {
    if (!authState.user?.id || authState.role !== 'FAMILY') return;

    try {
      setLoading(true);

      // Get family member record for current user
      const { data: familyMember, error: memberError } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', authState.user.id)
        .maybeSingle();

      if (memberError || !familyMember) {
        console.error('Error finding family member:', memberError);
        return;
      }

      // Get ALL permission requests for this family member
      const { data: allRequestsData, error: requestsError } = await supabase
        .from('permissions_requests')
        .select('*')
        .eq('family_member_id', familyMember.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      const transformedRequests = (allRequestsData || []).map(p => ({
        id: p.id,
        family_member_id: p.family_member_id,
        feature: p.permission_type,
        status: (p.status.toLowerCase() === 'declined' ? 'rejected' : p.status.toLowerCase()) as 'pending' | 'approved' | 'rejected',
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      setAllRequests(transformedRequests);
      
      // Separate approved permissions for easy access
      const approvedPermissions = transformedRequests.filter(p => p.status === 'approved');
      setPermissions(approvedPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Request new permission - save to both tables
  const requestPermission = async (feature: string) => {
    if (!authState.user?.id) return;

    try {
      // Get family member record
      const { data: familyMember, error: memberError } = await supabase
        .from('family_members')
        .select('id, main_user_id')
        .eq('user_id', authState.user.id)
        .maybeSingle();

      if (memberError || !familyMember) {
        throw new Error('לא נמצא רישום בן משפחה');
      }

      // Check current status of this feature
      const currentStatus = getPermissionStatus(feature);
      if (currentStatus === 'pending') {
        toast({
          title: 'בקשה קיימת',
          description: 'כבר נשלחה בקשה עבור פיצ\'ר זה והיא ממתינה לאישור',
          variant: 'default'
        });
        return;
      }
      
      if (currentStatus === 'rejected') {
        toast({
          title: 'הרשאה קיימת',
          description: 'כבר יש לך הרשאה עבור פיצ\'ר זה',
          variant: 'default'
        });
        return;
      }

      // Create entry in permissions_requests (main table)
      const { error: permissionError } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: familyMember.main_user_id,
          family_member_id: familyMember.id,
          permission_type: feature,
          status: 'PENDING'
        });

      if (permissionError) throw permissionError;

      toast({
        title: 'בקשה נשלחה',
        description: 'בקשתך נשלחה למשתמש הראשי לבדיקה',
      });

      // Reload permissions
      await loadPermissions();
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשליחת הבקשה',
        variant: 'destructive'
      });
    }
  };

  // Request to join a primary user (creates family_link if missing and logs in permissions_requests)
  const requestJoin = async (primaryUserId: string) => {
    if (!authState.user?.id) return;

    try {
      // Fetch profile for details
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', authState.user.id)
        .maybeSingle();

      const familyMemberName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'בן משפחה';
      const familyMemberEmail = profile?.email || '';

      // Ensure family_member exists (or create one)
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', authState.user.id)
        .eq('main_user_id', primaryUserId)
        .maybeSingle();

      let familyMemberId = existingMember?.id as string | undefined;

      if (!familyMemberId) {
        const { data: newMember, error: memberInsertError } = await supabase
          .from('family_members')
          .insert({
            main_user_id: primaryUserId,
            user_id: authState.user.id,
            full_name: familyMemberName || 'בן משפחה',
            relationship_label: 'בן משפחה',
            email: familyMemberEmail,
            phone: profile?.phone || '',
            gender: 'male', // Default value, can be updated later
            status: 'PENDING'
          })
          .select('id')
          .single();
        if (memberInsertError) throw memberInsertError;
        familyMemberId = newMember?.id as string;
      }

      if (!familyMemberId) throw new Error('יצירת רישום בן משפחה נכשלה');

      // Insert permissions request for join
      const { error: reqErr } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: primaryUserId,
          family_member_id: familyMemberId,
          permission_type: 'join',
          status: 'pending'
        });
      if (reqErr) throw reqErr;

      toast({ title: 'בקשת הצטרפות נשלחה', description: 'הבקשה הועברה למשתמש הראשי' });
    } catch (error: any) {
      console.error('Error requesting join:', error);
      toast({ title: 'שגיאה', description: error.message || 'שגיאה בשליחת בקשת הצטרפות', variant: 'destructive' });
    }
  };

  // Get permission status for a specific feature
  const getPermissionStatus = (feature: string): 'none' | 'pending' | 'approved' | 'rejected' => {
    // Check from all requests to get the latest status
    const latestRequest = allRequests
      .filter(p => p.feature === feature)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (latestRequest) return latestRequest.status;
    return 'none';
  };

  // Get all requests for notifications display
  const getMyRequests = () => allRequests;

  // Check if user has permission for a feature
  const hasPermission = (feature: string): boolean => {
    return getPermissionStatus(feature) === 'approved';
  };

  useEffect(() => {
    if (authState.user?.id && authState.role === 'FAMILY') {
      loadPermissions();

      // Set up real-time subscription for permission updates
      const channel = supabase
        .channel('family-permissions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'permissions_requests'
          },
          (payload) => {
            console.log('Permission request change received:', payload);
            loadPermissions(); // Reload when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authState.user?.id, authState.role]);

  return {
    permissions,
    allRequests,
    loading,
    requestPermission,
    requestJoin,
    getPermissionStatus,
    hasPermission,
    getMyRequests,
    loadPermissions
  };
};