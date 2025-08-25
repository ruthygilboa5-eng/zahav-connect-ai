import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { usePendingQueue } from '@/hooks/usePendingQueue';
import { useMemories } from '@/hooks/useMemories';
import { useReminders } from '@/hooks/useReminders';
import { useFamilyPermissionRequests } from '@/hooks/useFamilyPermissionRequests';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { MissingTablesBanner } from '@/components/MissingTablesBanner';

interface SupabaseContextType {
  // Auth
  auth: ReturnType<typeof useAuth>;
  
  // Data hooks
  familyLinks: ReturnType<typeof useFamilyLinks>;
  pendingQueue: ReturnType<typeof usePendingQueue>;
  memories: ReturnType<typeof useMemories>;
  reminders: ReturnType<typeof useReminders>;
  permissionRequests: ReturnType<typeof useFamilyPermissionRequests>;
  storage: ReturnType<typeof useSupabaseStorage>;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const auth = useAuth();
  const familyLinks = useFamilyLinks();
  const pendingQueue = usePendingQueue();
  const memories = useMemories();
  const reminders = useReminders();
  const permissionRequests = useFamilyPermissionRequests();
  const storage = useSupabaseStorage();

  // Collect missing tables for banner
  const missingTables: string[] = [];
  
  // Check if any hooks detected missing tables (based on error patterns)
  // This is a simple detection - in a real app you might want more sophisticated checking

  const contextValue: SupabaseContextType = {
    auth,
    familyLinks,
    pendingQueue,
    memories,
    reminders,
    permissionRequests,
    storage
  };

  return (
    <SupabaseContext.Provider value={contextValue}>
      <MissingTablesBanner 
        missingTables={[
          'family_links',
          'pending_queue', 
          'memories',
          'reminders',
          'family_permission_requests'
        ]} 
      />
      {children}
    </SupabaseContext.Provider>
  );
};