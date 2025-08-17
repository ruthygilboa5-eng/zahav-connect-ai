import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { USE_PREVIEW_MAIN_USER, PREVIEW_USER } from '@/config/preview';

type UserRole = 'main_user' | 'family_basic' | 'family_emergency' | null;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    // Preview mode - set mock user immediately
    if (USE_PREVIEW_MAIN_USER) {
      const mockUser = {
        id: PREVIEW_USER.id,
        email: 'preview@zahav.com',
        user_metadata: {
          first_name: PREVIEW_USER.firstName,
          last_name: PREVIEW_USER.lastName
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      
      setUser(mockUser);
      setUserRole(PREVIEW_USER.role);
      setLoading(false);
      return;
    }

    // Normal auth flow
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role after auth state changes
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then((role) => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // In preview mode, do nothing
    if (USE_PREVIEW_MAIN_USER) {
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const isMainUser = () => userRole === 'main_user';
  const isFamilyMember = () => userRole === 'family_basic' || userRole === 'family_emergency';
  const isEmergencyContact = () => userRole === 'family_emergency';

  return {
    user,
    session,
    userRole,
    loading,
    signOut,
    isMainUser,
    isFamilyMember,
    isEmergencyContact,
    refetchRole: () => user ? fetchUserRole(user.id).then(setUserRole) : Promise.resolve()
  };
};