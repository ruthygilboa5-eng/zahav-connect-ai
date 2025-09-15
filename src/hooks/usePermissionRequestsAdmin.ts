import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface PermissionRequestAdmin {
  id: string;
  primary_user_id: string;
  family_member_id: string;
  family_member_name: string;
  family_member_email: string;
  permission_type: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  created_at: string;
  updated_at: string;
  relationship_to_primary_user?: string;
}

export const usePermissionRequestsAdmin = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PermissionRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);

      let query = supabase
        .from('permissions_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If admin - show all requests, if main user - show only their requests
      if (authState.role === 'MAIN_USER') {
        query = query.eq('primary_user_id', authState.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get additional family member details if needed
      const familyLinkIds = (data || []).map(req => req.family_member_id).filter(Boolean);
      let familyLinksMap: Record<string, any> = {};
      
      if (familyLinkIds.length > 0) {
        const { data: familyLinksData } = await supabase
          .from('family_links')
          .select('id, relationship_to_primary_user')
          .in('id', familyLinkIds);
        
        familyLinksMap = (familyLinksData || []).reduce((acc, link) => {
          acc[link.id] = link;
          return acc;
        }, {} as Record<string, any>);
      }

      const formattedRequests: PermissionRequestAdmin[] = (data || []).map(request => {
        const familyLink = familyLinksMap[request.family_member_id];
        return {
          id: request.id,
          primary_user_id: request.primary_user_id,
          family_member_id: request.family_member_id,
          family_member_name: request.family_member_name,
          family_member_email: request.family_member_email,
          permission_type: request.permission_type,
          status: request.status as 'PENDING' | 'APPROVED' | 'DECLINED',
          created_at: request.created_at,
          updated_at: request.updated_at,
          relationship_to_primary_user: familyLink?.relationship_to_primary_user
        };
      });

      setRequests(formattedRequests);
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

  const updateRequestStatus = async (requestId: string, status: 'APPROVED' | 'DECLINED') => {
    try {
      const { error } = await supabase
        .from('permissions_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'הפעולה בוצעה בהצלחה',
        description: status === 'APPROVED' ? 'הבקשה אושרה' : 'הבקשה נדחתה'
      });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון סטטוס הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getPendingCount = () => {
    return requests.filter(req => req.status === 'PENDING').length;
  };

  const getRequestsByStatus = (status: 'PENDING' | 'APPROVED' | 'DECLINED') => {
    return requests.filter(req => req.status === status);
  };

  useEffect(() => {
    if (authState.user?.id && (authState.role === 'ADMIN' || authState.role === 'MAIN_USER')) {
      loadRequests();

      // Set up real-time subscription
      const channel = supabase
        .channel('permission-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'permissions_requests'
          },
          (payload) => {
            console.log('Permission request change received:', payload);
            loadRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authState.user?.id, authState.role]);

  return {
    requests,
    loading,
    updateRequestStatus,
    getPendingCount,
    getRequestsByStatus,
    refresh: loadRequests
  };
};