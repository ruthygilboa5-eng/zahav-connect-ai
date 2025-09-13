import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type Role = 'MAIN_USER' | 'FAMILY' | 'ADMIN' | null;

export interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  firstName: string;
  memberId?: string;
  scopes?: string[];
  user?: User | null;
  session?: Session | null;
}

interface AuthContextType {
  authState: AuthState;
  loginAsMainUser: (firstName?: string) => void;
  loginAsFamily: (firstName?: string) => void;
  logout: () => void;
  login: (role: Role, memberId?: string, scopes?: string[]) => void;
  setFirstName: (firstName: string) => void;
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

interface FixedAuthProviderProps {
  children: ReactNode;
}

export const FixedAuthProvider = ({ children }: FixedAuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    firstName: '',
    memberId: undefined,
    scopes: undefined,
    user: null,
    session: null
  });

  useEffect(() => {
    console.log('FixedAuthProvider useEffect mounting');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, 'session exists:', !!session);
      
      if (session?.user) {
        // Set basic auth state immediately (no async work here)
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: session.user!,
          session,
        }));

        // Defer Supabase calls to avoid deadlocks in the auth callback
        setTimeout(async () => {
          try {
            const [rolesRes, profileRes] = await Promise.all([
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user!.id),
              supabase
                .from('user_profiles')
                .select('first_name')
                .eq('user_id', session.user!.id)
                .maybeSingle(),
            ]);

            const roles = (rolesRes.data || []).map(r => r.role as string);
            const profile = profileRes.data;

            // Role precedence: admin > family_member > primary_user
            let userRole: Role = null;
            if (roles.includes('admin')) userRole = 'ADMIN';
            else if (roles.includes('family_member')) userRole = 'FAMILY';
            else if (roles.includes('primary_user')) userRole = 'MAIN_USER';
            else userRole = 'MAIN_USER'; // Default to MAIN_USER for users without explicit roles

            const firstName = profile?.first_name || '';

            console.log('Setting auth state for user:', session.user!.id, 'role:', userRole);
            setAuthState({
              isAuthenticated: true,
              role: userRole,
              firstName,
              user: session.user!,
              session,
              memberId: userRole === 'FAMILY' ? 'family-1' : undefined,
              scopes: userRole === 'FAMILY' ? ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'] : undefined
            });
          } catch (error) {
            console.error('Error loading user data:', error);
            // Default to FAMILY role if error
            setAuthState({
              isAuthenticated: true,
              role: 'FAMILY',
              firstName: '',
              user: session.user!,
              session,
              memberId: 'family-1',
              scopes: ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT']
            });
          } finally {
            setLoading(false);
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
        setLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      console.log('FixedAuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const loginAsMainUser = (firstName: string = 'משתמש ראשי') => {
    // For demo purposes, set local state
    setAuthState({
      isAuthenticated: true,
      role: 'MAIN_USER',
      firstName,
      memberId: undefined,
      scopes: undefined,
      user: null,
      session: null
    });
  };

  const loginAsFamily = (firstName: string = 'בן משפחה') => {
    const defaultScopes = ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'];
    setAuthState({
      isAuthenticated: true,
      role: 'FAMILY',
      firstName,
      memberId: 'family-1',
      scopes: defaultScopes,
      user: null,
      session: null
    });
  };

  const login = (role: Role, memberId?: string, scopes?: string[]) => {
    if (role === 'MAIN_USER') {
      loginAsMainUser();
    } else if (role === 'FAMILY') {
      loginAsFamily();
    }
  };

  const setFirstName = (firstName: string) => {
    setAuthState(prev => ({ ...prev, firstName }));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthState({
        isAuthenticated: false,
        role: null,
        firstName: '',
        memberId: undefined,
        scopes: undefined,
        user: null,
        session: null
      });
    }
    return { error };
  };

  const logout = () => {
    // For demo purposes, just clear local state
    setAuthState({
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined,
      user: null,
      session: null
    });
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
  }), [authState, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};