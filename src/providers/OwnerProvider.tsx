import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OwnerContextType {
  ownerUserId: string | null;
  setOwnerUserId: (userId: string | null) => void;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const useOwnerContext = () => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwnerContext must be used within an OwnerProvider');
  }
  return context;
};

interface OwnerProviderProps {
  children: ReactNode;
}

export const OwnerProvider = ({ children }: OwnerProviderProps) => {
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  return (
    <OwnerContext.Provider value={{ ownerUserId, setOwnerUserId }}>
      {children}
    </OwnerContext.Provider>
  );
};