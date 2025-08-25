import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { usePendingQueue } from '@/hooks/usePendingQueue';
import { useMemories } from '@/hooks/useMemories';
import { useReminders } from '@/hooks/useReminders';
import { useFamilyPermissionRequests } from '@/hooks/useFamilyPermissionRequests';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { MissingTablesBanner } from '@/components/MissingTablesBanner';
import { useLocation } from 'react-router-dom';
import { SHOW_ADMIN_BANNER } from '@/config/dev';

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
  const location = useLocation();
  const auth = useAuth();
  const familyLinks = useFamilyLinks();
  const pendingQueue = usePendingQueue();
  const memories = useMemories();
  const reminders = useReminders();
  const permissionRequests = useFamilyPermissionRequests();
  const storage = useSupabaseStorage();

  const contextValue: SupabaseContextType = {
    auth,
    familyLinks,
    pendingQueue,
    memories,
    reminders,
    permissionRequests,
    storage
  };

  // Collect missing tables from hooks
  const missingTables: string[] = [];
  if (familyLinks.missingTables) missingTables.push('family_links');
  if (pendingQueue.missingTables) missingTables.push('pending_queue');
  if (memories.missingTables) missingTables.push('memories');
  if (reminders.missingTables) missingTables.push('reminders');
  if (permissionRequests.missingTables) missingTables.push('family_permission_requests');
  // Add other missing table checks as needed

  // Show admin banner only if:
  // - Feature flag is enabled
  // - User is authenticated as MAIN_USER  
  // - Not on landing page
  // - There are actually missing tables
  const shouldShowBanner = 
    SHOW_ADMIN_BANNER && 
    auth.authState.isAuthenticated && 
    auth.authState.role === 'MAIN_USER' && 
    location.pathname !== '/' && 
    missingTables.length > 0;

  return (
    <SupabaseContext.Provider value={contextValue}>
      {shouldShowBanner && (
        <MissingTablesBanner missingTables={missingTables} />
      )}
      {children}
    </SupabaseContext.Provider>
  );
};