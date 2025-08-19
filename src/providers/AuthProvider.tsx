import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  role: 'MAIN_USER' | 'FAMILY' | null;
  firstName: string;
}

interface AuthContextType {
  authState: AuthState;
  login: (role: 'MAIN_USER' | 'FAMILY') => void;
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
    firstName: ''
  });

  const login = (role: 'MAIN_USER' | 'FAMILY') => {
    setAuthState({
      isAuthenticated: true,
      role,
      firstName: 'Demo'
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      role: null,
      firstName: ''
    });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};