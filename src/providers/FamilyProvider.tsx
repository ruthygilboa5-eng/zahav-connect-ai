import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FamilyMember, PendingItem, Memory, Reminder, FamilyScope } from '@/types/family';

interface FamilyContextType {
  // Family members management
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'invitedAt'>) => void;
  updateMemberStatus: (memberId: string, status: FamilyMember['status']) => void;
  updateMemberScopes: (memberId: string, scopes: FamilyScope[]) => void;
  removeFamilyMember: (memberId: string) => void;
  
  // Pending queue management
  pendingQueue: PendingItem[];
  addToPendingQueue: (item: Omit<PendingItem, 'id' | 'submittedAt'>) => void;
  approvePendingItem: (itemId: string) => void;
  rejectPendingItem: (itemId: string) => void;
  
  // Content management
  memories: Memory[];
  reminders: Reminder[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  
  // Helper functions
  getMemberById: (memberId: string) => FamilyMember | undefined;
  getMemberScopes: (memberId: string) => FamilyScope[];
  canMemberPerformAction: (memberId: string, scope: FamilyScope) => boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamilyProvider = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamilyProvider must be used within a FamilyProvider');
  }
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  // State management
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    // Mock data for development
    {
      id: 'member-1',
      fullName: 'רותי כהן',
      relation: 'בת',
      phone: '050-1234567',
      status: 'APPROVED',
      scopes: ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'],
      invitedAt: '2024-01-15T10:00:00Z',
      approvedAt: '2024-01-15T10:05:00Z'
    },
    {
      id: 'member-2', 
      fullName: 'דני לוי',
      relation: 'בן',
      phone: '050-7654321',
      status: 'PENDING',
      scopes: ['POST_MEDIA', 'EMERGENCY_ONLY'],
      invitedAt: '2024-01-16T14:30:00Z'
    }
  ]);

  const [pendingQueue, setPendingQueue] = useState<PendingItem[]>([
    // Mock pending items
    {
      id: 'pending-1',
      type: 'STORY',
      fromMemberId: 'member-1',
      fromMemberName: 'רותי',
      title: 'סיפור מהילדות',
      content: 'אני זוכרת איך סבא היה מלמד אותי לשחק שח',
      submittedAt: '2024-01-17T09:15:00Z'
    }
  ]);

  const [memories, setMemories] = useState<Memory[]>([
    {
      id: 'memory-1',
      title: 'תמונה משפחתית',
      content: 'תמונה מחתונה הזהב',
      type: 'PHOTO',
      createdAt: '2024-01-10T12:00:00Z'
    }
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 'reminder-1',
      title: 'תרופת לחץ דם',
      description: 'לקחת כדור בבוקר עם האוכל',
      type: 'MEDICATION',
      scheduledFor: '2024-01-18T08:00:00Z',
      isActive: true,
      createdAt: '2024-01-15T16:00:00Z'
    }
  ]);

  // Family members management
  const addFamilyMember = (memberData: Omit<FamilyMember, 'id' | 'invitedAt'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `member-${Date.now()}`,
      invitedAt: new Date().toISOString()
    };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const updateMemberStatus = (memberId: string, status: FamilyMember['status']) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { 
            ...member, 
            status,
            approvedAt: status === 'APPROVED' ? new Date().toISOString() : member.approvedAt
          }
        : member
    ));
  };

  const updateMemberScopes = (memberId: string, scopes: FamilyScope[]) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === memberId ? { ...member, scopes } : member
    ));
  };

  const removeFamilyMember = (memberId: string) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
  };

  // Pending queue management
  const addToPendingQueue = (itemData: Omit<PendingItem, 'id' | 'submittedAt'>) => {
    const newItem: PendingItem = {
      ...itemData,
      id: `pending-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    setPendingQueue(prev => [...prev, newItem]);
  };

  const approvePendingItem = (itemId: string) => {
    setPendingQueue(prev =>
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'APPROVED' as const, viewed: true }
          : item
      )
    );

    // Move approved item to appropriate location
    const approvedItem = pendingQueue.find(item => item.id === itemId);
    if (approvedItem) {
      switch (approvedItem.type) {
        case 'MEDIA':
        case 'STORY':
          addMemory({
            title: approvedItem.title,
            content: approvedItem.content,
            type: approvedItem.type === 'MEDIA' ? 'PHOTO' : 'STORY',
            fromFamily: true,
            fromMemberName: approvedItem.fromMemberName
          });
          break;
        case 'REMINDER':
          addReminder({
            title: approvedItem.title,
            description: approvedItem.content,
            type: (approvedItem.metadata?.reminderType as any) || 'EVENT',
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            isActive: true,
            fromFamily: true,
            fromMemberName: approvedItem.fromMemberName
          });
          break;
        case 'GAME_INVITE':
          // TODO: Handle game invites
          break;
      }
    }
  };

  const rejectPendingItem = (itemId: string) => {
    setPendingQueue(prev =>
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'REJECTED' as const, viewed: true }
          : item
      )
    );
  };

  // Content management
  const addMemory = (memoryData: Omit<Memory, 'id' | 'createdAt'>) => {
    const newMemory: Memory = {
      ...memoryData,
      id: `memory-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMemories(prev => [...prev, newMemory]);
  };

  const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: `reminder-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setReminders(prev => [...prev, newReminder]);
  };

  // Helper functions
  const getMemberById = (memberId: string) => {
    return familyMembers.find(member => member.id === memberId);
  };

  const getMemberScopes = (memberId: string) => {
    const member = getMemberById(memberId);
    return member?.scopes || [];
  };

  const canMemberPerformAction = (memberId: string, scope: FamilyScope) => {
    const member = getMemberById(memberId);
    return member?.status === 'APPROVED' && member.scopes.includes(scope);
  };

  const value: FamilyContextType = {
    familyMembers,
    addFamilyMember,
    updateMemberStatus,
    updateMemberScopes,
    removeFamilyMember,
    
    pendingQueue,
    addToPendingQueue,
    approvePendingItem,
    rejectPendingItem,
    
    memories,
    reminders,
    addMemory,
    addReminder,
    
    getMemberById,
    getMemberScopes,
    canMemberPerformAction
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};