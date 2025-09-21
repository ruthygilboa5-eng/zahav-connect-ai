import React, { createContext, useContext, ReactNode } from 'react';
import { FamilyMember, LegacyFamilyMember, PendingItem, Memory, Reminder, FamilyScope } from '@/types/family';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface FamilyContextType {
  // Family members management - using new schema
  familyMembers: FamilyMember[];
  loading: boolean;
  addFamilyMember: (member: Partial<FamilyMember>) => Promise<FamilyMember | null>;
  updateMemberStatus: (memberId: string, status: FamilyMember['status']) => void;
  removeFamilyMember: (memberId: string) => void;
  refresh: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamilyProvider = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamilyProvider must be used within a FamilyProvider');
  }
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  // Use the real family members hook
  const { 
    familyMembers, 
    loading, 
    addFamilyMember: addMember, 
    updateFamilyMember, 
    deleteFamilyMember, 
    refetch 
  } = useFamilyMembers();

  const addFamilyMember = async (memberData: Partial<FamilyMember>) => {
    return await addMember({
      full_name: memberData.full_name || '',
      relationship_label: memberData.relationship_label || '',
      gender: (memberData.gender as 'male' | 'female') || 'male',
      email: memberData.email || '',
      phone: memberData.phone,
      status: memberData.status || 'PENDING'
    });
  };

  const updateMemberStatus = (memberId: string, status: FamilyMember['status']) => {
    updateFamilyMember(memberId, { status });
  };

  const removeFamilyMember = (memberId: string) => {
    deleteFamilyMember(memberId);
  };

  const value: FamilyContextType = {
    familyMembers,
    loading,
    addFamilyMember,
    updateMemberStatus,
    removeFamilyMember,
    refresh: refetch
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};