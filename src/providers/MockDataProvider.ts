import { Contact, UserProfile } from '@/types/database';
import { ContactsProvider, ProfileProvider, Reminder, Memory, RemindersProvider, MemoriesProvider } from './DataProvider';
import { PREVIEW_USER } from '@/config/preview';

// Mock data storage
let mockContacts: Contact[] = [];

let mockProfile: UserProfile = {
  id: crypto.randomUUID(),
  user_id: PREVIEW_USER.id,
  first_name: PREVIEW_USER.firstName,
  last_name: PREVIEW_USER.lastName,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

let mockReminders: Reminder[] = [
  {
    id: "rem-1",
    title: "תרופת בוקר",
    description: "לקחת את התרופה עם כוס מים",
    scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: "rem-2", 
    title: "פגישה עם הרופא",
    description: "בדיקת מעקב במרפאה",
    scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    completed: false,
    created_at: new Date().toISOString()
  }
];

let mockMemories: Memory[] = [
  {
    id: "mem-1",
    title: "חתונה של שרה",
    description: "זכרון יפה מהחתונה של הנכדה",
    image_url: "/placeholder.svg",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: "mem-2",
    title: "טיול משפחתי לכנרת",
    description: "יום נפלא עם כל המשפחה",
    image_url: "/placeholder.svg", 
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  },
  {
    id: "mem-3",
    title: "יום הולדת 80",
    description: "חגיגה משפחתית גדולה",
    image_url: "/placeholder.svg",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
  }
];

// Mock contacts provider
export const mockContactsProvider: ContactsProvider = {
  async getContacts(): Promise<Contact[]> {
    return [...mockContacts];
  },

  async addContact(contactData): Promise<Contact> {
    const newContact: Contact = {
      id: crypto.randomUUID(),
      owner_user_id: PREVIEW_USER.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...contactData
    };
    mockContacts = [newContact, ...mockContacts];
    return newContact;
  },

  async updateContact(id: string, updates): Promise<Contact> {
    const index = mockContacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    
    mockContacts[index] = { ...mockContacts[index], ...updates, updated_at: new Date().toISOString() };
    return mockContacts[index];
  },

  async deleteContact(id: string): Promise<void> {
    mockContacts = mockContacts.filter(c => c.id !== id);
  },

  async sendEmergencyRequest(contactId: string): Promise<void> {
    const contact = mockContacts.find(c => c.id === contactId);
    if (contact) {
      contact.is_emergency_candidate = true;
      contact.emergency_status = 'PENDING';
      contact.updated_at = new Date().toISOString();
    }
  }
};

// Mock profile provider
export const mockProfileProvider: ProfileProvider = {
  async getProfile(): Promise<UserProfile | null> {
    return { ...mockProfile };
  },

  async updateProfile(updates): Promise<UserProfile> {
    mockProfile = { ...mockProfile, ...updates, updated_at: new Date().toISOString() };
    return { ...mockProfile };
  }
};

// Mock reminders provider
export const mockRemindersProvider: RemindersProvider = {
  async getReminders(): Promise<Reminder[]> {
    return [...mockReminders];
  },

  async addReminder(reminderData): Promise<Reminder> {
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...reminderData
    };
    mockReminders = [newReminder, ...mockReminders];
    return newReminder;
  },

  async updateReminder(id: string, updates): Promise<Reminder> {
    const index = mockReminders.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    
    mockReminders[index] = { ...mockReminders[index], ...updates };
    return mockReminders[index];
  },

  async deleteReminder(id: string): Promise<void> {
    mockReminders = mockReminders.filter(r => r.id !== id);
  }
};

// Mock memories provider
export const mockMemoriesProvider: MemoriesProvider = {
  async getMemories(): Promise<Memory[]> {
    return [...mockMemories];
  },

  async addMemory(memoryData): Promise<Memory> {
    const newMemory: Memory = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...memoryData
    };
    mockMemories = [newMemory, ...mockMemories];
    return newMemory;
  },

  async updateMemory(id: string, updates): Promise<Memory> {
    const index = mockMemories.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Memory not found');
    
    mockMemories[index] = { ...mockMemories[index], ...updates };
    return mockMemories[index];
  },

  async deleteMemory(id: string): Promise<void> {
    mockMemories = mockMemories.filter(m => m.id !== id);
  }
};