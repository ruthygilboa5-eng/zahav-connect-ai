// Family system types and constants

export type AppRole = 'MAIN_USER' | 'FAMILY';

export type FamilyScope = 
  | 'POST_MEDIA'           // העלאת תמונות/וידאו לתור ממתין
  | 'POST_STORY'           // שיתוף סיפורים לתור ממתין
  | 'SUGGEST_REMINDER'     // הצעת תזכורות (נכנס לאישור)
  | 'INVITE_GAME'         // הזמנת משחק משותף
  | 'CHAT'                // גישה לצ'אט המשפחה
  | 'EMERGENCY_ONLY';     // קבלת התראות SOS (ללא גישה לדשבורד)

// Family action keys for UI consistency
export type FamilyActionKey = 'POST_MEDIA' | 'POST_STORY' | 'SUGGEST_REMINDER' | 'INVITE_GAME' | 'CHAT';

// Family actions constant - single source of truth
export const FAMILY_ACTIONS = [
  { key: 'POST_MEDIA' as const, title: 'העלאת מדיה', icon: 'Camera', scope: 'POST_MEDIA' as FamilyScope },
  { key: 'POST_STORY' as const, title: 'שיתוף סיפור', icon: 'Upload', scope: 'POST_STORY' as FamilyScope },
  { key: 'SUGGEST_REMINDER' as const, title: 'הצעת תזכורת', icon: 'Bell', scope: 'SUGGEST_REMINDER' as FamilyScope },
  { key: 'INVITE_GAME' as const, title: 'הזמנת משחק', icon: 'Gamepad2', scope: 'INVITE_GAME' as FamilyScope },
  { key: 'CHAT' as const, title: 'צ\'אט משפחתי', icon: 'MessageSquare', scope: 'CHAT' as FamilyScope },
] as const;

// The 5 main scopes for the dashboard (excluding EMERGENCY_ONLY)
export const DASHBOARD_SCOPES = [
  'POST_MEDIA',
  'POST_STORY', 
  'SUGGEST_REMINDER',
  'INVITE_GAME',
  'CHAT'
] as const;

// Scope constants for consistency
export const FAMILY_SCOPES = {
  POST_MEDIA: 'POST_MEDIA' as const,
  POST_STORY: 'POST_STORY' as const,
  SUGGEST_REMINDER: 'SUGGEST_REMINDER' as const,
  INVITE_GAME: 'INVITE_GAME' as const,
  CHAT: 'CHAT' as const,
  EMERGENCY_ONLY: 'EMERGENCY_ONLY' as const,
} as const;

export interface FamilyMember {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string;
  ownerEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
  scopes: FamilyScope[];
  invitedAt: string;
  approvedAt?: string;
}

export interface PendingItem {
  id: string;
  type: 'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE';
  fromMemberId: string;
  fromMemberName: string;
  title: string;
  content: string;
  submittedAt: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  viewed?: boolean;
  metadata?: Record<string, any>; // עבור נתונים נוספים לפי סוג הפריט
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  type: 'PHOTO' | 'VIDEO' | 'STORY';
  createdAt: string;
  fromFamily?: boolean;
  fromMemberName?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'MEDICATION' | 'APPOINTMENT' | 'EVENT';
  scheduledFor: string;
  isActive: boolean;
  createdAt: string;
  fromFamily?: boolean;
  fromMemberName?: string;
}

export interface FamilyPermissionRequest {
  id: string;
  ownerUserId: string;
  familyLinkId: string;
  scope: FamilyScope;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
}

// Scope labels for UI
export const scopeLabels: Record<FamilyScope, string> = {
  POST_MEDIA: 'העלאת תמונות',
  POST_STORY: 'שיתוף סיפורים',
  SUGGEST_REMINDER: 'הצעת תזכורות',
  INVITE_GAME: 'הזמנת משחקים',
  CHAT: 'צ\'אט משפחה',
  EMERGENCY_ONLY: 'התראות חירום בלבד'
};

// Scope status types
export type ScopeStatus = 'APPROVED' | 'PENDING' | 'DECLINED' | 'NONE';

// Relation options for family members
export const relationOptions = [
  'בן/בת',
  'נכד/נכדה', 
  'אח/אחות',
  'דוד/דודה',
  'חבר/חברה',
  'שכן/שכנה',
  'מטפל/ת',
  'אחר'
];