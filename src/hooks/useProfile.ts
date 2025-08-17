import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { profileProvider } from '@/providers';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const data = await profileProvider.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הפרופיל",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'first_name' | 'last_name'>>) => {
    try {
      const updatedProfile = await profileProvider.updateProfile(updates);
      setProfile(updatedProfile);

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