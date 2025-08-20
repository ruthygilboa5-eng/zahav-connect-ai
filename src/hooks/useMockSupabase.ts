import { useState, useCallback } from 'react';
import { FamilyMember, PendingItem, Memory, Reminder, FamilyScope } from '@/types/family';

// Mock data storage
const mockProfiles = new Map();
const mockFamilyLinks = new Map<string, FamilyMember>();
const mockPendingQueue = new Map<string, PendingItem>();
const mockMemories = new Map<string, Memory>();
const mockReminders = new Map<string, Reminder>();

// Initialize some mock data
const initMockData = () => {
  if (mockFamilyLinks.size === 0) {
    mockFamilyLinks.set('family-1', {
      id: 'family-1',
      fullName: 'דוד כהן',
      relation: 'בן',
      phone: '050-1234567',
      status: 'APPROVED',
      scopes: ['POST_MEDIA', 'SUGGEST_REMINDER', 'PLAY_GAMES'],
      invitedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    });

    mockFamilyLinks.set('family-2', {
      id: 'family-2', 
      fullName: 'רחל לוי',
      relation: 'בת',
      phone: '052-9876543',
      status: 'PENDING',
      scopes: ['POST_MEDIA', 'EMERGENCY_ONLY'],
      invitedAt: new Date().toISOString()
    });
  }
};

export const useMockSupabase = () => {
  const [loading, setLoading] = useState(false);

  initMockData();

  // Profile functions
  const getProfile = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
    const profile = mockProfiles.get('current-user') || {
      id: 'user-1',
      first_name: 'משה',
      last_name: 'ישראלי',
      phone: '050-1111111',
      email: 'moshe@example.com'
    };
    setLoading(false);
    return profile;
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    mockProfiles.set('current-user', { ...mockProfiles.get('current-user'), ...data });
    setLoading(false);
    return mockProfiles.get('current-user');
  }, []);

  // Family Links functions
  const listFamilyLinks = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setLoading(false);
    return Array.from(mockFamilyLinks.values());
  }, []);

  const inviteFamilyLink = useCallback(async (memberData: Omit<FamilyMember, 'id' | 'invitedAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const newMember: FamilyMember = {
      ...memberData,
      id: `family-${Date.now()}`,
      invitedAt: new Date().toISOString()
    };
    mockFamilyLinks.set(newMember.id, newMember);
    setLoading(false);
    return newMember;
  }, []);

  const setFamilyLinkStatus = useCallback(async (id: string, status: 'APPROVED' | 'REVOKED') => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    const member = mockFamilyLinks.get(id);
    if (member) {
      member.status = status;
      if (status === 'APPROVED') {
        member.approvedAt = new Date().toISOString();
      }
      mockFamilyLinks.set(id, member);
    }
    setLoading(false);
    return member || null;
  }, []);

  const updateFamilyLink = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    const member = mockFamilyLinks.get(id);
    if (member) {
      Object.assign(member, updates);
      mockFamilyLinks.set(id, member);
    }
    setLoading(false);
    return member || null;
  }, []);

  // Pending Queue functions  
  const submitPending = useCallback(async (item: Omit<PendingItem, 'id' | 'submittedAt' | 'status'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 250));
    const newItem: PendingItem = {
      ...item,
      id: `pending-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    mockPendingQueue.set(newItem.id, newItem);
    setLoading(false);
    return newItem;
  }, []);

  const listPending = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setLoading(false);
    return Array.from(mockPendingQueue.values());
  }, []);

  const approvePending = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const item = mockPendingQueue.get(id);
    if (item) {
      item.status = 'APPROVED';
      
      // Mock: Move approved content to appropriate collections
      if (item.type === 'MEDIA' || item.type === 'STORY') {
        const memory: Memory = {
          id: `memory-${Date.now()}`,
          title: item.title,
          content: item.content,
          type: item.type === 'MEDIA' ? 'PHOTO' : 'STORY',
          createdAt: new Date().toISOString(),
          fromFamily: true,
          fromMemberName: item.fromMemberName
        };
        mockMemories.set(memory.id, memory);
      } else if (item.type === 'REMINDER') {
        const reminder: Reminder = {
          id: `reminder-${Date.now()}`,
          title: item.title,
          description: item.content,
          type: 'EVENT',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          fromFamily: true,
          fromMemberName: item.fromMemberName
        };
        mockReminders.set(reminder.id, reminder);
      }
      
      mockPendingQueue.set(id, item);
    }
    setLoading(false);
    return item || null;
  }, []);

  const declinePending = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    const item = mockPendingQueue.get(id);
    if (item) {
      item.status = 'REJECTED';
      mockPendingQueue.set(id, item);
    }
    setLoading(false);
    return item || null;
  }, []);

  // Content functions (for display purposes)
  const getMemories = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setLoading(false);
    return Array.from(mockMemories.values());
  }, []);

  const getReminders = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setLoading(false);
    return Array.from(mockReminders.values());
  }, []);

  return {
    loading,
    // Profile
    getProfile,
    updateProfile,
    // Family Links
    listFamilyLinks,
    inviteFamilyLink,
    setFamilyLinkStatus,
    updateFamilyLink,
    // Pending Queue
    submitPending,
    listPending,
    approvePending,
    declinePending,
    // Content
    getMemories,
    getReminders
  };
};