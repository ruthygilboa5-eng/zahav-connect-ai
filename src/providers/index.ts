import { USE_PREVIEW_MAIN_USER } from '@/config/preview';
import { 
  mockContactsProvider, 
  mockProfileProvider, 
  mockRemindersProvider, 
  mockMemoriesProvider 
} from './MockDataProvider';
import { 
  supabaseContactsProvider, 
  supabaseProfileProvider, 
  supabaseRemindersProvider, 
  supabaseMemoriesProvider 
} from './SupabaseDataProvider';

// Export the appropriate providers based on preview mode
export const contactsProvider = USE_PREVIEW_MAIN_USER ? mockContactsProvider : supabaseContactsProvider;
export const profileProvider = USE_PREVIEW_MAIN_USER ? mockProfileProvider : supabaseProfileProvider;
export const remindersProvider = USE_PREVIEW_MAIN_USER ? mockRemindersProvider : supabaseRemindersProvider;
export const memoriesProvider = USE_PREVIEW_MAIN_USER ? mockMemoriesProvider : supabaseMemoriesProvider;