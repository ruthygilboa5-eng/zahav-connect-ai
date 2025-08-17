import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useTempAuth } from '@/hooks/useTempAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useTempAuth();

  const fetchProfile = async () => {
    console.log('fetchProfile called, user:', user);
    try {
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      // Set user context for RLS
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: user.id
      });

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את הפרופיל",
          variant: "destructive",
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'first_name' | 'last_name'>>) => {
    console.log('updateProfile called with:', updates, 'user:', user);
    try {
      if (!user) {
        console.log('No user for profile update');
        return false;
      }

      // Set user context for RLS
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: user.id
      });

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Create new profile
        const newProfile = {
          user_id: user.id,
          first_name: updates.first_name || '',
          last_name: updates.last_name || ''
        };

        const { data, error } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
      }

      toast({
        title: "הצלחה",
        description: "הפרופיל עודכן בהצלחה",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הפרופיל",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};