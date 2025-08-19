import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEV_MODE_DEMO, DEMO_USER } from '@/config/dev';
import { useAuth } from '@/hooks/useAuth';

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

// Mock Provider Implementation
class MockProvider implements DataProviderType {
  private _user: User | null = null;
  private _userProfile: UserProfile | null = null;
  private _contacts: Contact[] = [];
  
  constructor(
    private setUser: (user: User | null) => void,
    private setUserProfile: (profile: UserProfile | null) => void,
    private setContacts: (contacts: Contact[]) => void,
    private setLoading: (loading: boolean) => void
  ) {
    // In demo mode, automatically set demo user
    this._user = DEMO_USER;
    this._userProfile = {
      firstName: DEMO_USER.firstName,
      lastName: DEMO_USER.lastName,
      displayName: DEMO_USER.firstName
    };
    this.setUser(this._user);
    this.setUserProfile(this._userProfile);
    this.setLoading(false);
  }

  get user() { return this._user; }
  get userProfile() { return this._userProfile; }
  get contacts() { return this._contacts; }
  get loading() { return false; }

  async signUp(email: string, password: string) {
    // Mock signup - just return success
    return { error: null };
  }

  async signOut() {
    this._user = null;
    this._userProfile = null;
    this._contacts = [];
    this.setUser(null);
    this.setUserProfile(null);
    this.setContacts([]);
    return { error: null };
  }

  async updateProfile(profile: UserProfile) {
    this._userProfile = profile;
    this.setUserProfile(profile);
  }

  async addContacts(contacts: Omit<Contact, 'id'>[]) {
    const newContacts = contacts.map((contact, index) => ({
      ...contact,
      id: `demo-contact-${Date.now()}-${index}`
    }));
    this._contacts = [...this._contacts, ...newContacts];
    this.setContacts(this._contacts);
  }

  async initAccount(profile: UserProfile, contacts: Omit<Contact, 'id'>[]) {
    await this.updateProfile(profile);
    await this.addContacts(contacts);
    return { error: null };
  }
}

// Real Provider Implementation (Supabase)
class SupabaseProvider implements DataProviderType {
  constructor(
    private supabaseUser: any,
    private supabaseLoading: boolean,
    private supabaseSignOut: () => Promise<{ error?: any }>,
    private setUser: (user: User | null) => void,
    private setUserProfile: (profile: UserProfile | null) => void,
    private setContacts: (contacts: Contact[]) => void,
    private setLoading: (loading: boolean) => void
  ) {}

  get user() {
    if (!this.supabaseUser) return null;
    return {
      id: this.supabaseUser.id,
      role: "MAIN_USER",
      firstName: "",
      lastName: "",
      email: this.supabaseUser.email,
      displayName: ""
    };
  }
  
  get userProfile() { return null; } // TODO: Implement with actual Supabase queries
  get contacts() { return []; } // TODO: Implement with actual Supabase queries  
  get loading() { return this.supabaseLoading; }

  async signUp(email: string, password: string) {
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

  async signOut() {
    return await this.supabaseSignOut();
  }

  async updateProfile(profile: UserProfile) {
    // TODO: Implement with actual Supabase update
  }

  async addContacts(contacts: Omit<Contact, 'id'>[]) {
    // TODO: Implement with actual Supabase insert
  }

  async initAccount(profile: UserProfile, contacts: Omit<Contact, 'id'>[]) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const contactsData = contacts.map(contact => ({
      full_name: contact.fullName,
      relation: contact.relation,
      phone: contact.phone,
      is_emergency_candidate: contact.isEmergencyCandidate
    }));

    const { error } = await supabase.rpc('init_account_with_profile_and_contacts', {
      p_first_name: profile.firstName,
      p_last_name: profile.lastName,
      p_display_name: profile.displayName,
      p_contacts: contactsData.length > 0 ? JSON.stringify(contactsData) : '[]'
    });

    return { error };
  }
}

// Context
const DataContext = createContext<DataProviderType | null>(null);

// Provider Component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user: supabaseUser, loading: supabaseLoading, signOut: supabaseSignOut } = useAuth();

  const provider = DEV_MODE_DEMO 
    ? new MockProvider(setUser, setUserProfile, setContacts, setLoading)
    : new SupabaseProvider(supabaseUser, supabaseLoading, supabaseSignOut, setUser, setUserProfile, setContacts, setLoading);

  return (
    <DataContext.Provider value={provider}>
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