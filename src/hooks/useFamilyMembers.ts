import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface FamilyMember {
  id: string;
  owner_user_id: string;
  email: string;
  full_name: string;
  relationship_label: string;
  gender: 'male' | 'female';
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTables, setMissingTables] = useState(false);
  const { authState } = useAuth();
  const { toast } = useToast();

  const fetchFamilyMembers = async () => {
    if (!authState.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('owner_user_id', authState.user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family members:', error);
        
        // Check if table doesn't exist
        if (error.message?.includes('relation "public.family_members" does not exist')) {
          setMissingTables(true);
        } else {
          toast({
            title: 'שגיאה בטעינת בני המשפחה',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      setFamilyMembers((data || []) as FamilyMember[]);
      setMissingTables(false);
    } catch (error: any) {
      console.error('Error in fetchFamilyMembers:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת בני המשפחה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFamilyMember = async (memberData: Omit<FamilyMember, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>) => {
    if (!authState.user) {
      toast({
        title: 'שגיאה',
        description: 'משתמש לא מחובר',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert({
          ...memberData,
          owner_user_id: authState.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding family member:', error);
        toast({
          title: 'שגיאה בהוספת בן משפחה',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      if (data) {
        setFamilyMembers(prev => [data as FamilyMember, ...prev]);
        toast({
          title: 'בן משפחה נוסף בהצלחה',
          description: `${data.full_name} נוסף לרשימת בני המשפחה`,
        });
        return data as FamilyMember;
      }
    } catch (error: any) {
      console.error('Error in addFamilyMember:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת בן המשפחה',
        variant: 'destructive',
      });
    }

    return null;
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .eq('owner_user_id', authState.user!.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating family member:', error);
        toast({
          title: 'שגיאה בעדכון בן משפחה',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      if (data) {
        setFamilyMembers(prev => 
          prev.map(member => member.id === id ? data as FamilyMember : member)
        );
        toast({
          title: 'בן משפחה עודכן בהצלחה',
          description: `${data.full_name} עודכן בהצלחה`,
        });
        return data as FamilyMember;
      }
    } catch (error: any) {
      console.error('Error in updateFamilyMember:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון בן המשפחה',
        variant: 'destructive',
      });
    }

    return null;
  };

  const deleteFamilyMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)
        .eq('owner_user_id', authState.user!.id);

      if (error) {
        console.error('Error deleting family member:', error);
        toast({
          title: 'שגיאה במחיקת בן משפחה',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      setFamilyMembers(prev => prev.filter(member => member.id !== id));
      toast({
        title: 'בן משפחה נמחק בהצלחה',
        description: 'בן המשפחה הוסר מהרשימה',
      });
      return true;
    } catch (error: any) {
      console.error('Error in deleteFamilyMember:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת בן המשפחה',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Fetch family members when auth state changes
  useEffect(() => {
    fetchFamilyMembers();
  }, [authState.user]);

  return {
    familyMembers,
    loading,
    missingTables,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    refetch: fetchFamilyMembers
  };
};