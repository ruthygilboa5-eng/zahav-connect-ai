import { useState, useEffect } from 'react';
import { Reminder } from '@/providers/DataProvider';
import { useToast } from '@/hooks/use-toast';
import { remindersProvider } from '@/providers';

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReminders = async () => {
    try {
      const data = await remindersProvider.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את התזכורות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'created_at'>) => {
    try {
      const newReminder = await remindersProvider.addReminder(reminderData);
      setReminders(prev => [newReminder, ...prev]);
      
      toast({
        title: "הצלחה",
        description: "התזכורת נוספה בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את התזכורת",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const updatedReminder = await remindersProvider.updateReminder(id, updates);
      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? updatedReminder : reminder
      ));

      toast({
        title: "הצלחה",
        description: "התזכורת עודכנה בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את התזכורת",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await remindersProvider.deleteReminder(id);
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      
      toast({
        title: "הצלחה",
        description: "התזכורת נמחקה בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את התזכורת",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    refetch: fetchReminders
  };
};