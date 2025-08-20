import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const defaultScopes: FamilyScope[] = ['POST_MEDIA', 'SUGGEST_REMINDER', 'PLAY_GAMES'];
    
    setAuthState({
      isAuthenticated: true,
      role,
      firstName: role === 'MAIN_USER' ? 'משתמש ראשי' : 'בן משפחה',
      memberId: role === 'FAMILY' ? (memberId || 'family-1') : undefined,
      scopes: role === 'FAMILY' ? (scopes || defaultScopes) : undefined
    });

    // Navigate to appropriate page after login
    if (typeof window !== 'undefined') {
      const targetPath = role === 'MAIN_USER' ? '/home' : '/family';
      window.location.href = targetPath;
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      role: null,
      firstName: '',
      memberId: undefined,
      scopes: undefined
    });
    
    // Navigate back to home
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};