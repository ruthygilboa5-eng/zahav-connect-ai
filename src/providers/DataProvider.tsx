import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEV_MODE_DEMO, DEMO_USER } from '@/config/dev';
import { useAuth } from '@/providers/AuthProvider';

// Types
export interface User {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
}

export interface Contact {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  isEmergencyCandidate: boolean;
  emergencyStatus?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
}

// Data Provider Interface
export interface DataProviderType {
  user: User | null;
  userProfile: UserProfile | null;
  contacts: Contact[];
  loading: boolean;
  
  // Auth methods
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  
  // Profile methods
  updateProfile: (profile: UserProfile) => Promise<void>;
  
  // Contact methods
  addContacts: (contacts: Omit<Contact, 'id'>[]) => Promise<void>;
  
  // Initialize account (used in signup wizard)
  initAccount: (profile: UserProfile, contacts: Omit<Contact, 'id'>[]) => Promise<{ error?: any }>;
}

// Context
const DataContext = createContext<DataProviderType | null>(null);

// Provider Component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { authState, signOut: supabaseSignOut, loading: supabaseLoading } = useAuth();

  // Initialize demo data once on mount if in demo mode
  useEffect(() => {
    if (DEV_MODE_DEMO) {
      setUser({
        id: "demo-user",
        role: "MAIN_USER",
        firstName: "",
        lastName: "",
        email: "demo@example.com",
        displayName: ""
      });
      setUserProfile({
        firstName: "",
        lastName: "",
        displayName: ""
      });
      setLoading(false);
    }
  }, []);

  // Handle supabase auth changes
  useEffect(() => {
    console.log('DataProvider useEffect triggered, DEV_MODE_DEMO:', DEV_MODE_DEMO, 'authState.user:', !!authState.user);
    if (!DEV_MODE_DEMO) {
      if (authState.user) {
        setUser({
          id: authState.user.id,
          role: "MAIN_USER",
          firstName: "",
          lastName: "",
          email: authState.user.email || "",
          displayName: ""
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setContacts([]);
      }
      setLoading(supabaseLoading);
    }
  }, [authState.user, supabaseLoading]); // Keep dependencies minimal

  const providerValue: DataProviderType = {
    user,
    userProfile,
    contacts,
    loading,
    
    async signUp(email: string, password: string) {
      if (DEV_MODE_DEMO) {
        // Mock signup - just return success
        return { error: null };
      } else {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        return { error };
      }
    },

    async signOut() {
      if (DEV_MODE_DEMO) {
        setUser(null);
        setUserProfile(null);
        setContacts([]);
        return { error: null };
      } else {
        return await supabaseSignOut();
      }
    },

    async updateProfile(profile: UserProfile) {
      if (DEV_MODE_DEMO) {
        setUserProfile(profile);
      } else {
        // TODO: Implement with actual Supabase update
      }
    },

    async addContacts(newContacts: Omit<Contact, 'id'>[]) {
      if (DEV_MODE_DEMO) {
        const contactsWithIds = newContacts.map((contact, index) => ({
          ...contact,
          id: `demo-contact-${Date.now()}-${index}`
        }));
        setContacts(prev => [...prev, ...contactsWithIds]);
      } else {
        // TODO: Implement with actual Supabase insert
      }
    },

    async initAccount(profile: UserProfile, contactsData: Omit<Contact, 'id'>[]) {
      if (DEV_MODE_DEMO) {
        setUserProfile(profile);
        const contactsWithIds = contactsData.map((contact, index) => ({
          ...contact,
          id: `demo-contact-${Date.now()}-${index}`
        }));
        setContacts(prev => [...prev, ...contactsWithIds]);
        return { error: null };
      } else {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const contacts = contactsData.map(contact => ({
          full_name: contact.fullName,
          relation: contact.relation,
          phone: contact.phone,
          is_emergency_candidate: contact.isEmergencyCandidate
        }));

        const { error } = await supabase.rpc('init_account_with_profile_and_contacts', {
          p_first_name: profile.firstName,
          p_last_name: profile.lastName,
          p_display_name: profile.displayName,
          p_contacts: contacts.length > 0 ? JSON.stringify(contacts) : '[]'
        });

        return { error };
      }
    }
  };

  return (
    <DataContext.Provider value={providerValue}>
      {children}
    </DataContext.Provider>
  );
}

// Hook
export function useDataProvider() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataProvider must be used within a DataProvider');
  }
  return context;
}