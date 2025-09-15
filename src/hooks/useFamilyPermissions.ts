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
    if (!authState.user?.id) return;

    try {
      setLoading(true);

      // Get family link for current user
      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')
        .select('id')
        .eq('member_user_id', authState.user.id)
        .maybeSingle();

      if (linkError || !familyLink) {
        console.error('Error finding family link:', linkError);
        return;
      }

      // Get permissions for this family member
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('family_members_permissions')
        .select('*')
        .eq('family_member_id', familyLink.id)
        .order('created_at', { ascending: false });

      if (permissionsError) throw permissionsError;

      setPermissions((permissionsData || []).map(p => ({
        ...p,
        status: p.status as 'pending' | 'approved' | 'rejected'
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
      // Get family link
      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')
        .select('id, owner_user_id')
        .eq('member_user_id', authState.user.id)
        .maybeSingle();

      if (linkError || !familyLink) {
        throw new Error('לא נמצא קישור משפחתי');
      }

      // Check if there's already a pending request for this feature
      const existingRequest = permissions.find(p => 
        p.feature === feature && p.status === 'pending'
      );

      if (existingRequest) {
        toast({
          title: 'בקשה קיימת',
          description: 'כבר נשלחה בקשה עבור פיצ\'ר זה וממתינה לאישור',
          variant: 'default'
        });
        return;
      }

      // Get family member details for permissions_requests
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', authState.user.id)
        .single();

      const familyMemberName = profileData ? 
        `${profileData.first_name} ${profileData.last_name}`.trim() : 
        'בן משפחה';
      const familyMemberEmail = profileData?.email || '';

      // Create entry in permissions_requests (main table)
      const { error: permissionError } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: familyLink.owner_user_id,
          family_member_id: familyLink.id,
          family_member_name: familyMemberName,
          family_member_email: familyMemberEmail,
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

      // Ensure family_link exists (or create one)
      const { data: existingLink } = await supabase
        .from('family_links')
        .select('id')
        .eq('member_user_id', authState.user.id)
        .eq('owner_user_id', primaryUserId)
        .maybeSingle();

      let familyLinkId = existingLink?.id as string | undefined;

      if (!familyLinkId) {
        const { data: newLink, error: linkInsertError } = await supabase
          .from('family_links')
          .insert({
            owner_user_id: primaryUserId,
            member_user_id: authState.user.id,
            full_name: familyMemberName || 'בן משפחה',
            relation: 'בן משפחה',
            email: familyMemberEmail,
            phone: profile?.phone || null,
            status: 'PENDING'
          })
          .select('id')
          .maybeSingle();
        if (linkInsertError) throw linkInsertError;
        familyLinkId = newLink?.id as string;
      }

      if (!familyLinkId) throw new Error('יצירת קישור משפחתי נכשלה');

      // Insert permissions request for join
      const { error: reqErr } = await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: primaryUserId,
          family_member_id: familyLinkId,
          family_member_name: familyMemberName,
          family_member_email: familyMemberEmail,
          permission_type: 'join',
          status: 'PENDING'
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
    const permission = permissions
      .filter(p => p.feature === feature)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return permission?.status || 'none';
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
            table: 'family_members_permissions'
          },
          (payload) => {
            console.log('Family permission change received:', payload);
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