import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FamilyScope } from '@/types/family';

export interface FamilyPermissionRequest {
  id: string;
  owner_user_id: string;
  family_link_id: string;
  scope: FamilyScope;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  created_at: string;
  updated_at: string;
}

export const useFamilyPermissionRequests = () => {
  const [requests, setRequests] = useState<FamilyPermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    // Guard: only run after auth and profile are ready
    if (!authState.isAuthenticated || !authState.user || !authState.role) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('family_permission_requests')
        .select('*')
        .eq('owner_user_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle missing table gracefully
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setMissingTables(true);
          setRequests([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Success - clear missing tables flag and set data
      setMissingTables(false);
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching permission requests:', error);
      toast({
        title: 'שגיאת טעינה',
        description: 'לא ניתן לטעון את בקשות ההרשאה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (familyLinkId: string, scope: FamilyScope) => {
    if (!authState.isAuthenticated) return { error: 'Not authenticated' };

    try {
      // Check if request already exists
      const { data: existing } = await (supabase as any)
        .from('family_permission_requests')
        .select('*')
        .eq('owner_user_id', authState.user?.id)
        .eq('family_link_id', familyLinkId)
        .eq('scope', scope)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (existing) {
        toast({
          title: 'בקשה קיימת',
          description: 'כבר קיימת בקשה הרשאה זו',
          variant: 'destructive',
        });
        return { error: 'Request already exists' };
      }

      const { data, error } = await (supabase as any)
        .from('family_permission_requests')
        .insert({
          owner_user_id: authState.user?.id,
          family_link_id: familyLinkId,
          scope,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setMissingTables(true);
          return { error: 'Table not found' };
        }
        throw error;
      }

      setRequests(prev => [data, ...prev]);
      toast({
        title: 'בקשה נשלחה',
        description: 'בקשת ההרשאה נשלחה לאישור',
      });

      return { data };
    } catch (error: any) {
      console.error('Error creating permission request:', error);
      return { error };
    }
  };

  const updateRequest = async (requestId: string, status: 'APPROVED' | 'DECLINED') => {
    try {
      const { data, error } = await (supabase as any)
        .from('family_permission_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));

      return { data };
    } catch (error: any) {
      console.error('Error updating permission request:', error);
      return { error };
    }
  };

  const getRequestStatus = (familyLinkId: string, scope: FamilyScope): 'PENDING' | 'APPROVED' | 'DECLINED' | 'NONE' => {
    const request = requests.find(r => 
      r.family_link_id === familyLinkId && 
      r.scope === scope
    );
    
    return request?.status || 'NONE';
  };

  useEffect(() => {
    fetchRequests();
  }, [authState.isAuthenticated, authState.role, authState.user?.id]);

  return {
    requests,
    loading,
    missingTables,
    createRequest,
    updateRequest,
    getRequestStatus,
    refetch: fetchRequests
  };
};