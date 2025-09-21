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

export const useFamilyPermissions = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load permissions for current family member
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

      // Get permissions based on approved requests in permissions_requests
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions_requests')
        .select('*')
        .eq('family_member_id', familyMember.id)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (permissionsError) throw permissionsError;

      setPermissions((permissionsData || []).map(p => ({
        id: p.id,
        family_member_id: p.family_member_id,
        feature: p.permission_type,
        status: p.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        created_at: p.created_at,
        updated_at: p.updated_at
      })));
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

      // Check if there's already a pending or approved request for this feature
      const { data: existingRequests, error: existingError } = await supabase
        .from('permissions_requests')
        .select('status')
        .eq('family_member_id', familyMember.id)
        .eq('permission_type', feature)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingError) throw existingError;

      const latestRequest = existingRequests?.[0];
      if (latestRequest && (latestRequest.status === 'PENDING' || latestRequest.status === 'APPROVED')) {
        const statusText = latestRequest.status === 'PENDING' ? 'ממתינה לאישור' : 'מאושרת';
        toast({
          title: 'בקשה קיימת',
          description: `כבר נשלחה בקשה עבור פיצ\'ר זה והיא ${statusText}`,
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
    // Check from current permissions (which are only approved ones)
    const approvedPermission = permissions.find(p => p.feature === feature);
    if (approvedPermission) return 'approved';
    
    // Would need separate query to check pending/rejected status in permissions_requests
    // For now, return 'none' if not in approved permissions
    return 'none';
  };

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
    loading,
    requestPermission,
    requestJoin,
    getPermissionStatus,
    hasPermission,
    loadPermissions
  };
};