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
        .single();

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

  // Request new permission
  const requestPermission = async (feature: string) => {
    if (!authState.user?.id) return;

    try {
      // Get family link
      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')
        .select('id')
        .eq('member_user_id', authState.user.id)
        .single();

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

      // Create new permission request
      const { error } = await supabase
        .from('family_members_permissions')
        .insert({
          family_member_id: familyLink.id,
          feature,
          status: 'pending'
        });

      if (error) throw error;

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
    getPermissionStatus,
    hasPermission,
    loadPermissions
  };
};