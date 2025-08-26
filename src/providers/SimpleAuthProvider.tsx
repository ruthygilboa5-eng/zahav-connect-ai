import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'MAIN_USER' | 'FAMILY' | null;

export interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  firstName: string;
  memberId?: string;
  scopes?: string[];
  user?: any;
  session?: any;
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

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider = ({ children }: SimpleAuthProviderProps) => {
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    firstName: '',
    memberId: undefined,
    scopes: undefined,
    user: null,
    session: null
  });

  const loginAsMainUser = (firstName: string = 'משתמש ראשי') => {
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
    setAuthState({
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined,
      user: null,
      session: null
    });
    return { error: null };
  };

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider value={{
      authState,
      loginAsMainUser,
      loginAsFamily,
      logout,
      login,
      setFirstName,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};