import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface PermissionRequestWithDetails {
  id: string;
  family_member_id: string;
  feature: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  family_member_name: string;
  family_member_email: string;
  relationship_to_primary_user: string;
}

export const useAdminPermissions = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Load permission requests for admin/main user
  const loadPermissionRequests = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);

      // Get all permission requests for family members owned by this user
      const { data: requestsData, error } = await supabase
        .from('family_members_permissions')
        .select(`
          *,
          family_links:family_member_id (
            full_name,
            email,
            relationship_to_primary_user,
            owner_user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter requests for family members owned by current user
      const filteredRequests = (requestsData || []).filter(request => 
        request.family_links?.owner_user_id === authState.user?.id
      );

      // Format the data
      const formattedRequests: PermissionRequestWithDetails[] = filteredRequests.map(request => ({
        id: request.id,
        family_member_id: request.family_member_id,
        feature: request.feature,
        status: request.status as 'pending' | 'approved' | 'rejected',
        created_at: request.created_at,
        updated_at: request.updated_at,
        family_member_name: request.family_links?.full_name || 'לא ידוע',
        family_member_email: request.family_links?.email || '',
        relationship_to_primary_user: request.family_links?.relationship_to_primary_user || ''
      }));

      setPermissionRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading permission requests:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת בקשות ההרשאות',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update permission request status
  const updatePermissionStatus = async (
    requestId: string, 
    newStatus: 'approved' | 'rejected',
    familyMemberName: string,
    familyMemberEmail: string,
    feature: string
  ) => {
    try {
      const { error } = await supabase
        .from('family_members_permissions')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification email
      try {
        const { error: notificationError } = await supabase.functions.invoke('send-permission-notification', {
          body: {
            family_member_id: requestId,
            feature,
            status: newStatus,
            family_member_name: familyMemberName,
            family_member_email: familyMemberEmail
          }
        });

        if (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't fail the main operation if email fails
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      toast({
        title: 'הפעולה בוצעה בהצלחה',
        description: newStatus === 'approved' ? 'הבקשה אושרה והתראה נשלחה' : 'הבקשה נדחתה והתראה נשלחה'
      });

      // Reload requests
      await loadPermissionRequests();
    } catch (error: any) {
      console.error('Error updating permission status:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בעדכון סטטוס הבקשה',
        variant: 'destructive'
      });
    }
  };

  // Get pending requests count
  const getPendingCount = () => {
    return permissionRequests.filter(req => req.status === 'pending').length;
  };

  // Get requests by status
  const getRequestsByStatus = (status: 'pending' | 'approved' | 'rejected') => {
    return permissionRequests.filter(req => req.status === status);
  };

  useEffect(() => {
    if (authState.user?.id && (authState.role === 'ADMIN' || authState.role === 'MAIN_USER')) {
      loadPermissionRequests();

      // Set up real-time subscription for permission updates
      const channel = supabase
        .channel('admin-permissions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'family_members_permissions'
          },
          (payload) => {
            console.log('Admin permission change received:', payload);
            loadPermissionRequests(); // Reload when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authState.user?.id, authState.role]);

  return {
    permissionRequests,
    loading,
    updatePermissionStatus,
    getPendingCount,
    getRequestsByStatus,
    loadPermissionRequests
  };
};