import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FamilyScope } from '@/types/family';

export interface FamilyLink {
  id: string;
  owner_user_id: string;
  member_user_id?: string;
  full_name: string;
  relation: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REVOKED';
  scopes: FamilyScope[];
  created_at: string;
}

export const useFamilyLinks = () => {
  const [familyLinks, setFamilyLinks] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();
  const { toast } = useToast();

  const showMissingTableError = () => {
    toast({
      title: 'טבלת נתונים חסרה',
      description: 'נא ליצור טבלת family_links ב-Supabase Dashboard',
      variant: 'destructive',
    });
  };

  const fetchFamilyLinks = async () => {
    if (!authState.isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('family_links')
        .select('*')
        .eq('owner_user_id', authState.memberId || '');

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          showMissingTableError();
          setFamilyLinks([]);
          return;
        }
        throw error;
      }

      setFamilyLinks(data || []);
    } catch (error: any) {
      console.error('Error fetching family links:', error);
      toast({
        title: 'שגיאת טעינה',
        description: 'לא ניתן לטעון את רשימת בני המשפחה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createFamilyLink = async (linkData: Omit<FamilyLink, 'id' | 'owner_user_id' | 'created_at'>) => {
    if (!authState.isAuthenticated) return { error: 'Not authenticated' };

    try {
      const { data, error } = await (supabase as any)
        .from('family_links')
        .insert({
          owner_user_id: authState.memberId,
          ...linkData
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

      setFamilyLinks(prev => [...prev, data]);
      toast({
        title: 'נוסף בהצלחה',
        description: 'בן המשפחה נוסף לרשימה',
      });

      return { data };
    } catch (error: any) {
      console.error('Error creating family link:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוסיף בן משפחה',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateFamilyLink = async (linkId: string, updates: Partial<FamilyLink>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('family_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

      setFamilyLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, ...data } : link
      ));

      toast({
        title: 'עודכן בהצלחה',
        description: 'פרטי בן המשפחה עודכנו',
      });

      return { data };
    } catch (error: any) {
      console.error('Error updating family link:', error);
      toast({
        title: 'שגיאת עדכון',
        description: 'לא ניתן לעדכן את הפרטים',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteFamilyLink = async (linkId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('family_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setFamilyLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: 'נמחק בהצלחה',
        description: 'בן המשפחה הוסר מהרשימה',
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting family link:', error);
      toast({
        title: 'שגיאת מחיקה',
        description: 'לא ניתן למחוק את בן המשפחה',
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchFamilyLinks();
  }, [authState.isAuthenticated, authState.memberId]);

  return {
    familyLinks,
    loading,
    createFamilyLink,
    updateFamilyLink,
    deleteFamilyLink,
    refetch: fetchFamilyLinks
  };
};