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
        console.log('No authenticated user, navigating to /');
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

      console.log('User found:', authUser.id);

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
      console.log('User role:', userRole);

      // Update global state with profile data
      setGlobalState(prev => ({
        ...prev,
        currentRole: userRole as 'primary_user' | 'family_member' | null,
        currentFirstName: profile.first_name,
        currentPhone: profile.phone,
        isLoading: false,
      }));

      // Navigate based on role - but check current location first
      const currentPath = window.location.pathname;
      let targetPath = '/';
      
      if (userRole === 'primary_user') {
        targetPath = '/family';
      } else if (userRole === 'family_member') {
        targetPath = '/dashboard';
      }

      console.log('Current path:', currentPath, 'Target path:', targetPath, 'User role:', userRole);
      
      // Only navigate if we're not already on the correct path and we're not on the home page
      if (currentPath !== targetPath && currentPath !== '/') {
        console.log('Navigating to:', targetPath);
        navigate(targetPath, { replace: true });
      } else {
        console.log('Already on correct path or home page, skipping navigation');
      }

    } catch (error) {
      console.error('Error in refreshUserData:', error);
      setGlobalState(prev => ({ ...prev, isLoading: false }));
      navigate('/', { replace: true });
    }
  }, [navigate]);

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
          navigate('/', { replace: true });
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
  }, []); // Remove dependencies to prevent infinite loop

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