import { useState, useEffect } from 'react';
import { Memory } from '@/providers/DataProvider';
import { useToast } from '@/hooks/use-toast';
import { memoriesProvider } from '@/providers';

export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMemories = async () => {
    try {
      const data = await memoriesProvider.getMemories();
      setMemories(data);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הזכרונות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async (memoryData: Omit<Memory, 'id' | 'created_at'>) => {
    try {
      const newMemory = await memoriesProvider.addMemory(memoryData);
      setMemories(prev => [newMemory, ...prev]);
      
      toast({
        title: "הצלחה",
        description: "הזכרון נוסף בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error adding memory:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את הזכרון",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    try {
      const updatedMemory = await memoriesProvider.updateMemory(id, updates);
      setMemories(prev => prev.map(memory => 
        memory.id === id ? updatedMemory : memory
      ));

      toast({
        title: "הצלחה",
        description: "הזכרון עודכן בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הזכרון",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await memoriesProvider.deleteMemory(id);
      setMemories(prev => prev.filter(memory => memory.id !== id));
      
      toast({
        title: "הצלחה",
        description: "הזכרון נמחק בהצלחה",
      });
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הזכרון",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  return {
    memories,
    loading,
    addMemory,
    updateMemory,
    deleteMemory,
    refetch: fetchMemories
  };
};