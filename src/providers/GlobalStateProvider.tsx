import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const clearGlobalState = useCallback(() => {
    setGlobalState({
      currentUserId: null,
      currentRole: null,
      currentFirstName: null,
      currentPhone: null,
      isLoading: false,
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      console.log('refreshUserData called - current path:', window.location.pathname);
      setGlobalState(prev => ({ ...prev, isLoading: true }));

      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        console.log('No authenticated user, clearing state');
        // No authenticated user - clear state but don't navigate (let AuthProvider handle this)
        setGlobalState({
          currentUserId: null,
          currentRole: null,
          currentFirstName: null,
          currentPhone: null,
          isLoading: false,
        });
        return;
      }

      console.log('User found:', authUser.id);

      // Fetch user profile from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('first_name, phone')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setGlobalState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (!profile) {
        console.error('No profile found for user');
        setGlobalState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const userRole = roleData?.role || null;
      console.log('User role:', userRole);

      // Update global state with profile data - NO NAVIGATION, let AuthProvider handle that
      setGlobalState({
        currentUserId: authUser.id,
        currentRole: userRole as 'primary_user' | 'family_member' | null,
        currentFirstName: profile.first_name,
        currentPhone: profile.phone,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error in refreshUserData:', error);
      setGlobalState(prev => ({ ...prev, isLoading: false }));
    }
  }, []); // Remove navigate dependency

  // Initialize on mount and listen for auth changes
  useEffect(() => {
    let isMounted = true;
    console.log('GlobalStateProvider useEffect mounting');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, 'isMounted:', isMounted);
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          refreshUserData();
        } else if (event === 'SIGNED_OUT') {
          clearGlobalState();
          // Don't navigate - let AuthProvider handle this
        }
      }
    );

    // Only do initial load if we don't have user data yet
    if (!globalState.currentUserId) {
      console.log('Doing initial refreshUserData');
      refreshUserData();
    }

    return () => {
      console.log('GlobalStateProvider useEffect cleanup');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove all dependencies to prevent infinite loop

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