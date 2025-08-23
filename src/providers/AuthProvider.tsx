import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'MAIN_USER' | 'FAMILY' | null;

export interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  firstName: string;
  memberId?: string; // For compatibility with existing code
  scopes?: string[]; // For compatibility with existing code
}

interface AuthContextType {
  authState: AuthState;
  loginAsMainUser: (firstName?: string) => void;
  loginAsFamily: (firstName?: string) => void;
  logout: () => void;
  login: (role: Role, memberId?: string, scopes?: string[]) => void; // For compatibility
  setFirstName: (firstName: string) => void; // For profile sync
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
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
    }
    return {
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined
    };
  });

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

  const logout = () => {
    const newState = {
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined
    };
    setAuthState(newState);
    clearPersist();
    
    // Clear any persisted route keys
    localStorage.removeItem('lastPath');
  };

  return (
    <AuthContext.Provider value={{ authState, loginAsMainUser, loginAsFamily, logout, login, setFirstName }}>
      {children}
    </AuthContext.Provider>
  );
};