import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type Role = 'MAIN_USER' | 'FAMILY' | null;

export interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  firstName: string;
  memberId?: string; // For compatibility with existing code
  scopes?: string[]; // For compatibility with existing code
  user?: User | null;
  session?: Session | null;
}

interface AuthContextType {
  authState: AuthState;
  loginAsMainUser: (firstName?: string) => void;
  loginAsFamily: (firstName?: string) => void;
  logout: () => void;
  login: (role: Role, memberId?: string, scopes?: string[]) => void; // For compatibility
  setFirstName: (firstName: string) => void; // For profile sync
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AUTH_KEY = 'zahav_auth_v1';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(() => {
    return {
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined,
      user: null,
      session: null
    };
  });

  useEffect(() => {
    console.log('AuthProvider useEffect mounting');
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider auth state change:', event, 'session exists:', !!session);
        if (session?.user) {
          // Load user profile to determine role
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              const userRole: Role = (profile as any)?.role === 'primary_user' ? 'MAIN_USER' : 'FAMILY';
              
              console.log('Setting auth state for user:', session.user.id, 'role:', userRole);
              setAuthState({
                isAuthenticated: true,
                role: userRole,
                firstName: profile?.first_name || '',
                user: session.user,
                session,
                memberId: userRole === 'FAMILY' ? 'family-1' : undefined,
                scopes: userRole === 'FAMILY' ? ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'] : undefined
              });
            } catch (error) {
              console.error('Error loading profile:', error);
              setAuthState({
                isAuthenticated: true,
                role: 'FAMILY',
                firstName: '',
                user: session.user,
                session,
                memberId: 'family-1',
                scopes: ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT']
              });
            }
          }, 0);
        } else {
          console.log('No session, clearing auth state');
          setAuthState({
            isAuthenticated: false,
            role: null,
            firstName: '',
            user: null,
            session: null,
            memberId: undefined,
            scopes: undefined
          });
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []); // No dependencies to prevent infinite loop

  const persist = (state: AuthState) => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state to localStorage:', error);
    }
  };

  const clearPersist = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Failed to clear auth state from localStorage:', error);
    }
  };

  const setFirstName = (firstName: string) => {
    const newState = { ...authState, firstName };
    setAuthState(newState);
    persist(newState);
  };

  const loginAsMainUser = (firstName: string = 'משתמש ראשי') => {
    const newState = {
      isAuthenticated: true,
      role: 'MAIN_USER' as Role,
      firstName,
      memberId: undefined,
      scopes: undefined
    };
    setAuthState(newState);
    persist(newState);
  };

  const loginAsFamily = (firstName: string = 'בן משפחה') => {
    const defaultScopes = ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'];
    const newState = {
      isAuthenticated: true,
      role: 'FAMILY' as Role,
      firstName,
      memberId: 'family-1',
      scopes: defaultScopes
    };
    setAuthState(newState);
    persist(newState);
  };

  // Legacy compatibility function
  const login = (role: Role, memberId?: string, scopes?: string[]) => {
    if (role === 'MAIN_USER') {
      loginAsMainUser();
    } else if (role === 'FAMILY') {
      loginAsFamily();
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const logout = async () => {
    await signOut();
    // State will be updated automatically via onAuthStateChange
    localStorage.removeItem('lastPath');
  };

  const contextValue = useMemo(() => ({
    authState, 
    loginAsMainUser, 
    loginAsFamily, 
    logout, 
    login, 
    setFirstName, 
    signOut, 
    loading 
  }), [authState, loading]); // Only recreate when authState or loading changes

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};