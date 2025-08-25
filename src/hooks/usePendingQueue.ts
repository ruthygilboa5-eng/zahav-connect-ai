import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface PendingQueueItem {
  id: string;
  owner_user_id: string;
  submitted_by_link_id: string;
  type: 'MEDIA' | 'STORY' | 'REMINDER' | 'GAME';
  payload: any; // JSON data
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  created_at: string;
}

export const usePendingQueue = () => {
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  const showMissingTableError = () => {
    toast({
      title: 'טבלת נתונים חסרה',
      description: 'נא ליצור טבלת pending_queue ב-Supabase Dashboard',
      variant: 'destructive',
    });
  };

  const fetchPendingItems = async () => {
    // Guard: only run after auth and profile are ready
    if (!authState.isAuthenticated || !authState.user || !authState.role) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('pending_queue')
        .select('*')
        .eq('owner_user_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle missing table gracefully
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setMissingTables(true);
          setPendingItems([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Success - clear missing tables flag and set data
      setMissingTables(false);
      setPendingItems(data || []);
    } catch (error: any) {
      console.error('Error fetching pending items:', error);
      toast({
        title: 'שגיאת טעינה',
        description: 'לא ניתן לטעון את רשימת הפריטים הממתינים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPendingItem = async (itemData: Omit<PendingQueueItem, 'id' | 'owner_user_id' | 'created_at' | 'status'>) => {
    if (!authState.isAuthenticated) return { error: 'Not authenticated' };

    try {
      const { data, error } = await (supabase as any)
        .from('pending_queue')
        .insert({
          owner_user_id: authState.user?.id,
          status: 'PENDING',
          ...itemData
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

      setPendingItems(prev => [data, ...prev]);
      return { data };
    } catch (error: any) {
      console.error('Error adding pending item:', error);
      return { error };
    }
  };

  const updatePendingItem = async (itemId: string, status: 'APPROVED' | 'DECLINED') => {
    try {
      const { data, error } = await (supabase as any)
        .from('pending_queue')
        .update({ status })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setPendingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status } : item
      ));

      return { data };
    } catch (error: any) {
      console.error('Error updating pending item:', error);
      return { error };
    }
  };

  const deletePendingItem = async (itemId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('pending_queue')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setPendingItems(prev => prev.filter(item => item.id !== itemId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting pending item:', error);
      return { error };
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user?.id) return;

    const channel = supabase
      .channel('pending_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_queue',
          filter: `owner_user_id=eq.${authState.user.id}`
        },
        (payload) => {
          console.log('Pending queue change:', payload);
          // Refetch to ensure data consistency
          fetchPendingItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState.isAuthenticated, authState.user?.id]);

  useEffect(() => {
    fetchPendingItems();
  }, [authState.isAuthenticated, authState.role, authState.user?.id]);

  return {
    pendingItems,
    loading,
    missingTables,
    addPendingItem,
    updatePendingItem,
    deletePendingItem,
    refetch: fetchPendingItems
  };
};