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
    console.log('OwnerProvider useEffect triggered, authState:', authState.isAuthenticated, authState.role, authState.user?.id);
    const determineOwnerUserId = async () => {
      try {
        setLoading(true);

        if (!authState.isAuthenticated) {
          console.log('No auth, clearing owner state');
          setOwnerUserId(null);
          setIsApproved(false);
          return;
        }

        if (authState.role === 'MAIN_USER') {
          // For main users, they are their own owner
          console.log('Main user, setting as own owner');
          setOwnerUserId(authState.user?.id || 'demo-main-user');
          setIsApproved(true);
          return;
        }

        if (authState.role === 'FAMILY') {
          console.log('Family member, checking if demo mode or real user');
          
          // If this is demo mode (no real session), auto-approve
          if (!authState.session || !authState.user) {
            console.log('Demo mode - auto approving family member');
            setOwnerUserId('demo-main-user');
            setIsApproved(true);
            return;
          }
          
          console.log('Real user - looking for any link (not just approved)');
          // For real family members, find their link (any status)
          const { data: familyLinks, error: linkError } = await supabase
            .from('family_links')
            .select('owner_user_id, status')
            .eq('member_user_id', authState.user.id)
            .limit(1);

          if (linkError) {
            console.error('Error fetching family link:', linkError);
          }

          if (familyLinks && familyLinks.length > 0 && familyLinks[0].owner_user_id) {
            console.log('Found link with status:', familyLinks[0].status);
            setOwnerUserId(familyLinks[0].owner_user_id);
            setIsApproved(familyLinks[0].status === 'APPROVED');
          } else {
            console.log('No link found');
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
  }, [authState.isAuthenticated, authState.user?.id, authState.role]); // Keep minimal dependencies

  return (
    <OwnerContext.Provider value={{ ownerUserId, setOwnerUserId, isApproved, loading }}>
      {children}
    </OwnerContext.Provider>
  );
};