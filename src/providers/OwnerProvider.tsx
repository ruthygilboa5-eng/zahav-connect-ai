import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface OwnerContextType {
  ownerUserId: string | null;
  setOwnerUserId: (userId: string | null) => void;
  isApproved: boolean;
  loading: boolean;
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
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();

  useEffect(() => {
    const determineOwnerUserId = async () => {
      try {
        setLoading(true);

        if (!authState.isAuthenticated || !authState.user) {
          setOwnerUserId(null);
          setIsApproved(false);
          return;
        }

        if (authState.role === 'MAIN_USER') {
          // For main users, they are their own owner
          setOwnerUserId(authState.user.id);
          setIsApproved(true);
          return;
        }

        if (authState.role === 'FAMILY') {
          // For family members, find their approved link
          const { data: familyLinks } = await supabase
            .from('family_links')
            .select('owner_user_id, status')
            .eq('member_user_id', authState.user.id)
            .eq('status', 'APPROVED')
            .limit(1);

          if (familyLinks && familyLinks.length > 0 && familyLinks[0].owner_user_id) {
            setOwnerUserId(familyLinks[0].owner_user_id);
            setIsApproved(true);
          } else {
            setOwnerUserId(null);
            setIsApproved(false);
          }
        }
      } catch (error) {
        console.error('Error determining owner user ID:', error);
        setOwnerUserId(null);
        setIsApproved(false);
      } finally {
        setLoading(false);
      }
    };

    determineOwnerUserId();
  }, [authState.isAuthenticated, authState.user?.id, authState.role]);

  return (
    <OwnerContext.Provider value={{ ownerUserId, setOwnerUserId, isApproved, loading }}>
      {children}
    </OwnerContext.Provider>
  );
};