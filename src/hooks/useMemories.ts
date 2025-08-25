import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface Memory {
  id: string;
  owner_user_id: string;
  kind: 'PHOTO' | 'VIDEO' | 'STORY';
  content: any; // JSON data with url/title/desc
  created_at: string;
}

export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  const fetchMemories = async () => {
    // Guard: only run after auth and profile are ready
    if (!authState.isAuthenticated || !authState.user || !authState.role) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('memories')
        .select('*')
        .eq('owner_user_id', authState.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle missing table gracefully
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setMissingTables(true);
          setMemories([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Success - clear missing tables flag and set data  
      setMissingTables(false);
      setMemories(data || []);
    } catch (error: any) {
      console.error('Error fetching memories:', error);
      toast({
        title: 'שגיאת טעינה',
        description: 'לא ניתן לטעון את הזיכרונות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async (memoryData: Omit<Memory, 'id' | 'owner_user_id' | 'created_at'>) => {
    if (!authState.isAuthenticated) return { error: 'Not authenticated' };

    try {
      const { data, error } = await (supabase as any)
        .from('memories')
        .insert({
          owner_user_id: authState.user?.id,
          ...memoryData
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

      setMemories(prev => [data, ...prev]);
      return { data };
    } catch (error: any) {
      console.error('Error adding memory:', error);
      return { error };
    }
  };

  const deleteMemory = async (memoryId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      setMemories(prev => prev.filter(memory => memory.id !== memoryId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting memory:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [authState.isAuthenticated, authState.role, authState.user?.id]);

  return {
    memories,
    loading,
    missingTables,
    addMemory,
    deleteMemory,
    refetch: fetchMemories
  };
};