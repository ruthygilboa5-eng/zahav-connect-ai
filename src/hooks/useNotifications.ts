import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface NotificationData {
  type: 'wake_up' | 'emergency' | 'reminder' | 'memory' | 'game' | 'family_board';
  message: string;
  recipients: string[];
  metadata?: Record<string, any>;
}

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  /**
   * Send notification to both in-app queue and email
   */
  const sendNotification = async (notificationData: NotificationData) => {
    if (!authState.user) {
      console.error('User not authenticated');
      return { error: 'Not authenticated' };
    }

    setLoading(true);
    
    try {
      // 1. Add to in-app pending_queue for notifications
      await addToPendingQueue(notificationData);
      
      // 2. Send email notifications (if recipients provided)
      if (notificationData.recipients.length > 0) {
        await sendEmailNotifications(notificationData);
      }

      toast({
        title: 'הודעה נשלחה',
        description: 'ההודעה נשלחה בהצלחה לבני המשפחה',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      toast({
        title: 'שגיאה בשליחת הודעה',
        description: 'לא ניתן לשלוח את ההודעה, נסה שוב',
        variant: 'destructive',
      });
      
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add notification to in-app pending queue
   */
  const addToPendingQueue = async (notificationData: NotificationData) => {
    const { error } = await supabase
      .from('pending_queue')
      .insert({
        owner_user_id: authState.user!.id,
        user_id: authState.user!.id,
        item_type: notificationData.type,
        item_data: {
          message: notificationData.message,
          recipients: notificationData.recipients,
          timestamp: new Date().toISOString(),
          ...notificationData.metadata
        },
        status: 'PENDING'
      });

    if (error) {
      console.error('Error adding to pending queue:', error);
      throw error;
    }
  };

  /**
   * Send email notifications via Supabase Edge Function
   */
  const sendEmailNotifications = async (notificationData: NotificationData) => {
    try {
      // Call the send-notification edge function
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: notificationData.type,
          message: notificationData.message,
          recipients: notificationData.recipients,
          metadata: notificationData.metadata
        }
      });

      if (error) {
        console.error('Error sending email notifications:', error);
        // Don't throw here - in-app notification should still work
      }

      return data;
    } catch (error) {
      console.error('Error calling notification function:', error);
      // Don't throw here - in-app notification should still work
    }
  };

  /**
   * Quick send functions for common notification types
   */
  const sendWakeUpNotification = (message: string, recipients: string[]) => {
    return sendNotification({
      type: 'wake_up',
      message,
      recipients,
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  const sendEmergencyNotification = (message: string, recipients: string[], location?: string) => {
    return sendNotification({
      type: 'emergency',
      message,
      recipients,
      metadata: { 
        location,
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    });
  };

  const sendReminderNotification = (message: string, recipients: string[], reminderData?: any) => {
    return sendNotification({
      type: 'reminder',
      message,
      recipients,
      metadata: { 
        reminder: reminderData,
        timestamp: new Date().toISOString()
      }
    });
  };

  const sendMemoryNotification = (message: string, recipients: string[], memoryData?: any) => {
    return sendNotification({
      type: 'memory',
      message,
      recipients,
      metadata: { 
        memory: memoryData,
        timestamp: new Date().toISOString()
      }
    });
  };

  const sendGameNotification = (message: string, recipients: string[], gameData?: any) => {
    return sendNotification({
      type: 'game',
      message,
      recipients,
      metadata: { 
        game: gameData,
        timestamp: new Date().toISOString()
      }
    });
  };

  return {
    sendNotification,
    sendWakeUpNotification,
    sendEmergencyNotification,
    sendReminderNotification,
    sendMemoryNotification,
    sendGameNotification,
    loading
  };
};