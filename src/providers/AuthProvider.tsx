import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppRole, FamilyScope } from '@/types/family';

export interface AuthState {
  isAuthenticated: boolean;
  role: AppRole | null;
  firstName: string;
  memberId?: string; // For FAMILY users - links to FamilyMember.id
  scopes?: FamilyScope[]; // For FAMILY users - their allowed actions
}

interface AuthContextType {
  authState: AuthState;
  login: (role: AppRole, memberId?: string, scopes?: FamilyScope[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    firstName: '',
    memberId: undefined,
    scopes: undefined
  });

  const login = (role: AppRole, memberId?: string, scopes?: FamilyScope[]) => {
    setAuthState({
      isAuthenticated: true,
      role,
      firstName: role === 'MAIN_USER' ? 'משתמש ראשי' : 'בן משפחה',
      memberId,
      scopes
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined
    });
    // Redirect to auth page after logout
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};