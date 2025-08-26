import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Global state types
export interface GlobalState {
  currentUserId: string | null;
  currentRole: 'primary_user' | 'family_member' | null;
  currentFirstName: string | null;
  currentPhone: string | null;
  isLoading: boolean;
}

interface GlobalStateContextType {
  globalState: GlobalState;
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
  refreshUserData: () => Promise<void>;
  clearGlobalState: () => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

interface GlobalStateProviderProps {
  children: ReactNode;
}

export const GlobalStateProvider = ({ children }: GlobalStateProviderProps) => {
  const [globalState, setGlobalState] = useState<GlobalState>({
    currentUserId: null,
    currentRole: null,
    currentFirstName: null,
    currentPhone: null,
    isLoading: true,
  });

  const navigate = useNavigate();

  const refreshUserData = async () => {
    try {
      setGlobalState(prev => ({ ...prev, isLoading: true }));

      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        // No authenticated user - clear state and navigate to home
        setGlobalState({
          currentUserId: null,
          currentRole: null,
          currentFirstName: null,
          currentPhone: null,
          isLoading: false,
        });
        navigate('/', { replace: true });
        return;
      }

      // Set currentUserId
      setGlobalState(prev => ({ ...prev, currentUserId: authUser.id }));

      // Fetch user profile from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('first_name, phone')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        navigate('/', { replace: true });
        return;
      }

      if (!profile) {
        console.error('No profile found for user');
        navigate('/', { replace: true });
        return;
      }

      // Check user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const userRole = roleData?.role || null;

      // Update global state with profile data
      setGlobalState(prev => ({
        ...prev,
        currentRole: userRole as 'primary_user' | 'family_member' | null,
        currentFirstName: profile.first_name,
        currentPhone: profile.phone,
        isLoading: false,
      }));

      // Navigate based on role
      if (userRole === 'primary_user') {
        navigate('/family', { replace: true });
      } else if (userRole === 'family_member') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (error) {
      console.error('Error in refreshUserData:', error);
      setGlobalState(prev => ({ ...prev, isLoading: false }));
      navigate('/', { replace: true });
    }
  };

  const clearGlobalState = () => {
    setGlobalState({
      currentUserId: null,
      currentRole: null,
      currentFirstName: null,
      currentPhone: null,
      isLoading: false,
    });
  };

  // Initialize on mount and listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUserData();
        } else if (event === 'SIGNED_OUT') {
          clearGlobalState();
          navigate('/', { replace: true });
        }
      }
    );

    // Initial load
    refreshUserData();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GlobalStateContext.Provider value={{ 
      globalState, 
      setGlobalState, 
      refreshUserData, 
      clearGlobalState 
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};