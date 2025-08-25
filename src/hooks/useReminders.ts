import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface Reminder {
  id: string;
  owner_user_id: string;
  title: string;
  category: 'MED' | 'EVENT' | 'APPT';
  due_at: string;
  created_by: string; // family link id
  created_at: string;
}

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();
  const { toast } = useToast();

  const showMissingTableError = () => {
    toast({
      title: 'טבלת נתונים חסרה',
      description: 'נא ליצור טבלת reminders ב-Supabase Dashboard',
      variant: 'destructive',
    });
  };

  const fetchReminders = async () => {
    if (!authState.isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('reminders')
        .select('*')
        .eq('owner_user_id', authState.memberId || '')
        .order('due_at', { ascending: true });

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          showMissingTableError();
          setReminders([]);
          return;
        }
        throw error;
      }

      setReminders(data || []);
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'owner_user_id' | 'created_at'>) => {
    if (!authState.isAuthenticated) return { error: 'Not authenticated' };

    try {
      const { data, error } = await (supabase as any)
        .from('reminders')
        .insert({
          owner_user_id: authState.memberId,
          ...reminderData
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          showMissingTableError();
          return { error: 'Table not found' };
        }
        throw error;
      }

      setReminders(prev => [...prev, data].sort((a, b) => 
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      ));
      return { data };
    } catch (error: any) {
      console.error('Error adding reminder:', error);
      return { error };
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [authState.isAuthenticated, authState.memberId]);

  return {
    reminders,
    loading,
    addReminder,
    deleteReminder,
    refetch: fetchReminders
  };
};