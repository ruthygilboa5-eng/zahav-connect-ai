// Family system types and constants

export type AppRole = 'MAIN_USER' | 'FAMILY';

export type FamilyScope = 
  | 'POST_MEDIA'           // העלאת תמונות/וידאו/סיפורים לתור ממתין
  | 'SUGGEST_REMINDER'     // הצעת תזכורות (נכנס לאישור)
  | 'INVITE_GAME'         // הזמנת משחק משותף
  | 'CHAT'                // גישה לצ'אט המשפחה
  | 'EMERGENCY_ONLY';     // קבלת התראות SOS (ללא גישה לדשבורד)

// Scope constants for consistency
export const FAMILY_SCOPES = {
  POST_MEDIA: 'POST_MEDIA' as const,
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

// Scope labels for UI
export const scopeLabels: Record<FamilyScope, string> = {
  POST_MEDIA: 'העלאת תמונות וסיפורים',
  SUGGEST_REMINDER: 'הצעת תזכורות',
  INVITE_GAME: 'הזמנת משחקים',
  CHAT: 'צ\'אט משפחה',
  EMERGENCY_ONLY: 'התראות חירום בלבד'
};

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