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
  primary_user_id: string;
  primary_user_name?: string;
  primary_user_email?: string;
}

export const useAdminPermissions = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Load permission requests for admin/main user - using unified view
  const loadPermissionRequests = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);

      // Use RPC based on role (views are restricted via RPC for security)
      let baseQuery;
      if (authState.role === 'ADMIN') {
        baseQuery = (supabase as any).rpc('get_permission_requests_admin');
      } else {
        // Main users use their own secure RPC
        baseQuery = (supabase as any).rpc('get_permission_requests_main_user');
      }

      const { data: requestsData, error: requestsError } = await baseQuery;

      if (requestsError) throw requestsError;

      // Format the data from the view
      const formattedRequests: PermissionRequestWithDetails[] = (requestsData || []).map(request => {
        return {
          id: request.id,
          family_member_id: request.family_member_id,
          feature: request.permission_type || 'unknown',
          status: request.status?.toLowerCase() as 'pending' | 'approved' | 'rejected' || 'pending',
          created_at: request.created_at,
          updated_at: request.updated_at,
          family_member_name: request.family_member_name || 'לא ידוע',
          family_member_email: request.family_member_email || '',
          relationship_to_primary_user: '', // This can be added to the view if needed
          primary_user_id: request.primary_user_id,
          primary_user_name: request.primary_user_name,
          primary_user_email: request.primary_user_email
        };
      });

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

  // Update permission request status - now updates permissions_requests (will sync to family_members_permissions via trigger)
  const updatePermissionStatus = async (
    requestId: string, 
    newStatus: 'approved' | 'rejected',
    familyMemberName: string,
    familyMemberEmail: string,
    feature: string
  ) => {
    try {
      const { error } = await supabase
        .from('permissions_requests')
        .update({ status: newStatus.toUpperCase() })
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
            table: 'permissions_requests'
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