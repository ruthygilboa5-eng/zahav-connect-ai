import { Contact, UserProfile } from '@/types/database';

// Data provider interface for contacts
export interface ContactsProvider {
  getContacts(): Promise<Contact[]>;
  addContact(contactData: Omit<Contact, 'id' | 'owner_user_id' | 'created_at' | 'updated_at'>): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  sendEmergencyRequest(contactId: string): Promise<void>;
}

// Data provider interface for profiles
export interface ProfileProvider {
  getProfile(): Promise<UserProfile | null>;
  updateProfile(updates: Partial<Pick<UserProfile, 'first_name' | 'last_name'>>): Promise<UserProfile>;
}

// Reminder interface (for future implementation)
export interface Reminder {
  id: string;
  title: string;
  description: string;
  scheduled_for: string;
  completed: boolean;
  created_at: string;
}

// Memory interface (for future implementation)
export interface Memory {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
}

// Data provider interface for reminders
export interface RemindersProvider {
  getReminders(): Promise<Reminder[]>;
  addReminder(reminderData: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
}

// Data provider interface for memories
export interface MemoriesProvider {
  getMemories(): Promise<Memory[]>;
  addMemory(memoryData: Omit<Memory, 'id' | 'created_at'>): Promise<Memory>;
  updateMemory(id: string, updates: Partial<Memory>): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;
}