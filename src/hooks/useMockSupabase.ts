import { useState, useEffect } from 'react';
import { FamilyMember, FamilyScope } from '@/types/family';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Mock data storage
const mockFamilyLinks = new Map<string, FamilyMember>();

// Initialize mock data
const initMockData = () => {
  if (mockFamilyLinks.size === 0) {
    // Add some mock family members with new schema
    mockFamilyLinks.set('family-1', {
      id: 'family-1',
      main_user_id: 'mock-main-user-1',
      full_name: 'דוד כהן',
      relationship_label: 'בן',
      gender: 'male',
      email: 'david@example.com',
      phone: '050-1234567',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scopes: ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT']
    });

    mockFamilyLinks.set('family-2', {
      id: 'family-2',
      main_user_id: 'mock-main-user-1', 
      full_name: 'רחל לוי',
      relationship_label: 'בת',
      gender: 'female',
      email: 'rachel@example.com',
      phone: '052-9876543',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scopes: ['POST_MEDIA', 'EMERGENCY_ONLY']
    });
  }
};

export const useMockSupabase = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    initMockData();
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = () => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const members = Array.from(mockFamilyLinks.values());
      setFamilyMembers(members);
      setLoading(false);
    }, 500);
  };

  const addFamilyMember = (memberData: Partial<FamilyMember>) => {
    const newMember: FamilyMember = {
      id: `family-${Date.now()}`,
      main_user_id: authState.user?.id || 'mock-user',
      full_name: memberData.full_name || '',
      relationship_label: memberData.relationship_label || '',
      gender: memberData.gender || 'male',
      email: memberData.email || '',
      phone: memberData.phone || '',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scopes: []
    };

    mockFamilyLinks.set(newMember.id, newMember);
    loadFamilyMembers();

    toast({
      title: 'בן משפחה נוסף',
      description: `${newMember.full_name} נוסף בהצלחה`,
    });

    return newMember;
  };

  const updateMemberStatus = (memberId: string, status: FamilyMember['status']) => {
    const member = mockFamilyLinks.get(memberId);
    if (member) {
      const updatedMember = { 
        ...member, 
        status,
        updated_at: new Date().toISOString()
      };
      mockFamilyLinks.set(memberId, updatedMember);
      loadFamilyMembers();

      toast({
        title: 'סטטוס עודכן',
        description: status === 'ACTIVE' ? 'הבקשה אושרה' : 'הבקשה נדחתה'
      });
    } else {
      toast({
        title: 'שגיאה',
        description: 'בן המשפחה לא נמצא',
        variant: 'destructive'
      });
    }
  };

  const updateMemberScopes = (memberId: string, scopes: FamilyScope[]) => {
    const member = mockFamilyLinks.get(memberId);
    if (member) {
      const updatedMember = { 
        ...member, 
        scopes,
        updated_at: new Date().toISOString()
      };
      mockFamilyLinks.set(memberId, updatedMember);
      loadFamilyMembers();

      toast({
        title: 'הרשאות עודכנו',
        description: `הרשאות של ${member.full_name} עודכנו בהצלחה`
      });
    }
  };

  const removeFamilyMember = (memberId: string) => {
    const member = mockFamilyLinks.get(memberId);
    if (member) {
      mockFamilyLinks.delete(memberId);
      loadFamilyMembers();

      toast({
        title: 'בן משפחה הוסר',
        description: `${member.full_name} הוסר מהרשימה`
      });
    }
  };

  // Get pending members (status = PENDING)
  const getPendingMembers = () => {
    return familyMembers.filter(member => member.status === 'PENDING');
  };

  // Get approved members (status = ACTIVE)
  const getApprovedMembers = () => {
    return familyMembers.filter(member => member.status === 'ACTIVE');
  };

  // Profile management
  const getProfile = async () => {
    return {
      first_name: 'משתמש דמה',
      last_name: 'ראשי',  
      phone: '050-1234567',
      email: 'user@example.com'
    };
  };

  const updateProfile = async (data: any) => {
    toast({
      title: 'פרופיל עודכן',
      description: 'הפרטים שלך עודכנו בהצלחה'
    });
    return true;
  };

  const setFamilyLinkStatus = async (memberId: string, status: string) => {
    updateMemberStatus(memberId, status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE');
  };

  const updateFamilyLink = async (memberId: string, data: any) => {
    if (data.scopes) {
      updateMemberScopes(memberId, data.scopes);
    }
  };

  // Pending queue management  
  const listPending = async () => {
    return [];
  };

  const approvePending = async (itemId: string) => {
    toast({
      title: 'פריט אושר',
      description: 'הפריט אושר בהצלחה'
    });
  };

  const declinePending = async (itemId: string) => {
    toast({
      title: 'פריט נדחה', 
      description: 'הפריט נדחה',
      variant: 'destructive'
    });
  };

  return {
    familyMembers,
    loading,
    addFamilyMember,
    updateMemberStatus,
    updateMemberScopes,
    removeFamilyMember,
    getPendingMembers,
    getApprovedMembers,
    refresh: loadFamilyMembers,
    getProfile,
    updateProfile,
    setFamilyLinkStatus,
    updateFamilyLink,
    listPending,
    approvePending,
    declinePending
  };
};

// Export for direct use in dev mode
export const mockFamilyLinksStore = mockFamilyLinks;

// Helper to check if we're in mock mode
export const isMockMode = () => {
  return process.env.NODE_ENV === 'development';
};

// Helper to get all mock data
export const getAllMockData = () => {
  initMockData();
  return Array.from(mockFamilyLinks.values());
};

// Helper to reset mock data
export const resetMockData = () => {
  mockFamilyLinks.clear();
  initMockData();
};

// Helper to add bulk mock data
export const addBulkMockData = (members: FamilyMember[]) => {
  members.forEach(member => {
    mockFamilyLinks.set(member.id, member);
  });
};

// Mock API response structure
export interface MockApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Mock API wrapper functions
export const mockApiCall = <T>(
  operation: () => T,
  delay: number = 300
): Promise<MockApiResponse<T>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const data = operation();
        resolve({
          data,
          error: null,
          success: true
        });
      } catch (error) {
        resolve({
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }, delay);
  });
};

// Mock Supabase client for development
export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          data: Array.from(mockFamilyLinks.values()).filter(
            (item: any) => item[column] === value
          ),
          error: null
        }),
        data: Array.from(mockFamilyLinks.values()),
        error: null
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => {
            const newItem = { ...data, id: `mock-${Date.now()}` };
            mockFamilyLinks.set(newItem.id, newItem);
            return { data: newItem, error: null };
          }
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => {
              const existing = Array.from(mockFamilyLinks.values()).find(
                (item: any) => item[column] === value
              );
              if (existing) {
                const updated = { ...existing, ...data };
                mockFamilyLinks.set(updated.id, updated);
                return { data: updated, error: null };
              }
              return { data: null, error: 'Item not found' };
            }
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          const item = Array.from(mockFamilyLinks.values()).find(
            (item: any) => item[column] === value
          );
          if (item) {
            mockFamilyLinks.delete(item.id);
            return { error: null };
          }
          return { error: 'Item not found' };
        }
      })
    })
  };
};