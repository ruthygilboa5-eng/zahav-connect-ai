import { Contact, UserProfile } from '@/types/database';
import { ContactsProvider, ProfileProvider, Reminder, Memory, RemindersProvider, MemoriesProvider } from './DataProvider';
import { supabase } from '@/integrations/supabase/client';

// Get current user ID helper
const getCurrentUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('No authenticated user');
  return session.user.id;
};

// Supabase contacts provider
export const supabaseContactsProvider: ContactsProvider = {
  async getContacts(): Promise<Contact[]> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Contact[];
  },

  async addContact(contactData): Promise<Contact> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...contactData,
        owner_user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data as Contact;
  },

  async updateContact(id: string, updates): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Contact;
  },

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async sendEmergencyRequest(contactId: string): Promise<void> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: consentError } = await supabase
      .from('emergency_consents')
      .insert({
        token,
        contact_id: contactId,
        expires_at: expiresAt.toISOString()
      });

    if (consentError) throw consentError;

    const { error: contactError } = await supabase
      .from('contacts')
      .update({ 
        is_emergency_candidate: true,
        emergency_status: 'PENDING' 
      })
      .eq('id', contactId);

    if (contactError) throw contactError;
  }
};

// Supabase profile provider
export const supabaseProfileProvider: ProfileProvider = {
  async getProfile(): Promise<UserProfile | null> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates): Promise<UserProfile> {
    const userId = await getCurrentUserId();
    
    // Get existing profile first to merge with updates
    const existing = await this.getProfile();
    
    const profileData = {
      user_id: userId,
      first_name: updates.first_name ?? existing?.first_name ?? '',
      last_name: updates.last_name ?? existing?.last_name ?? ''
    };
    
    const { data, error } = await supabase
      .from('user_profiles') 
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Placeholder implementations for reminders and memories (to be implemented later)
export const supabaseRemindersProvider: RemindersProvider = {
  async getReminders(): Promise<Reminder[]> {
    // TODO: Implement with real Supabase table
    return [];
  },

  async addReminder(reminderData): Promise<Reminder> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  },

  async updateReminder(id: string, updates): Promise<Reminder> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  },

  async deleteReminder(id: string): Promise<void> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  }
};

export const supabaseMemoriesProvider: MemoriesProvider = {
  async getMemories(): Promise<Memory[]> {
    // TODO: Implement with real Supabase table
    return [];
  },

  async addMemory(memoryData): Promise<Memory> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  },

  async updateMemory(id: string, updates): Promise<Memory> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  },

  async deleteMemory(id: string): Promise<void> {
    // TODO: Implement with real Supabase table
    throw new Error('Not implemented yet');
  }
};