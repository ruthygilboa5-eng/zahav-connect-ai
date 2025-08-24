import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useTempAuth } from '@/hooks/useTempAuth';
import { useAuth } from '@/providers/AuthProvider';
import { DEV_MODE_DEMO } from '@/config/dev';

interface ExtendedProfile extends UserProfile {
  role?: 'MAIN_USER' | 'FAMILY';
}

export const useProfile = () => {
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useTempAuth();
  const { setFirstName } = useAuth();

  // Reactive sync: when profile firstName changes, update auth state immediately
  useEffect(() => {
    if (profile?.first_name && profile.first_name.trim()) {
      setFirstName(profile.first_name);
    }
  }, [profile?.first_name, setFirstName]);

  // Load user profile by ID (for both current user and owner context)
  const loadUserProfile = useCallback(async (userId: string): Promise<ExtendedProfile | null> => {
    if (DEV_MODE_DEMO) {
      // Return minimal mock profile without demo names
      return {
        id: userId,
        user_id: userId,
        first_name: '',
        last_name: '',
        display_name: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'FAMILY'
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        // Create minimal profile if not found
        const newProfile = {
          user_id: userId,
          first_name: '',
          last_name: '',
          display_name: ''
        };

        const { data: created, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        return { ...created, role: 'FAMILY' }; // Default to FAMILY
      }

      // Check if user has MAIN_USER role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'main_user')
        .maybeSingle();

      return { 
        ...data, 
        role: roleData ? 'MAIN_USER' : 'FAMILY' 
      };
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    console.log('fetchProfile called, user:', user);
    try {
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const profileData = await loadUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadUserProfile]);

  const updateProfile = async (updates: Partial<Pick<ExtendedProfile, 'first_name' | 'last_name'>>) => {
    console.log('updateProfile called with:', updates, 'user:', user);
    try {
      if (!user) {
        console.log('No user for profile update');
        return false;
      }

      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        
        // Sync with auth state for immediate greeting updates
        if (updates.first_name) {
          setFirstName(updates.first_name);
        }
      } else {
        // Create new profile using upsert to handle duplicates
        const newProfile = {
          user_id: user.id,
          first_name: updates.first_name || '',
          last_name: updates.last_name || ''
        };

        const { data, error } = await supabase
          .from('user_profiles')
          .upsert(newProfile, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
        
        // Sync with auth state for immediate greeting updates
        if (updates.first_name) {
          setFirstName(updates.first_name);
        }
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
  }, [fetchProfile]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
    loadUserProfile
  };
};