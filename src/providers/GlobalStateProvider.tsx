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
  console.log('GlobalStateProvider render - DISABLED FOR DEBUGGING');
  
  // Provide minimal state to prevent crashes
  const mockGlobalState: GlobalState = {
    currentUserId: null,
    currentRole: null,
    currentFirstName: null,
    currentPhone: null,
    isLoading: false,
  };

  const mockContext = {
    globalState: mockGlobalState,
    setGlobalState: () => {}, 
    refreshUserData: async () => {},
    clearGlobalState: () => {}
  };

  // Disable GlobalStateProvider completely to isolate the auth issue
  return (
    <GlobalStateContext.Provider value={mockContext}>
      {children}
    </GlobalStateContext.Provider>
  );
};