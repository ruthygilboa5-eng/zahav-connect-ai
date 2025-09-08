export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  email?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  owner_user_id: string;
  full_name: string;
  relation: 'FAMILY' | 'INSTITUTION' | 'NEIGHBOR' | 'CAREGIVER' | 'OTHER';
  phone: string;
  is_emergency_candidate: boolean;
  emergency_status: 'NONE' | 'PENDING' | 'APPROVED' | 'DECLINED';
  created_at: string;
  updated_at: string;
}

export interface EmergencyConsent {
  id: string;
  token: string;
  contact_id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const relationLabels = {
  FAMILY: 'בן/בת משפחה',
  INSTITUTION: 'מוסד',
  NEIGHBOR: 'שכן/ה',
  CAREGIVER: 'מטפל/ת',
  OTHER: 'אחר'
} as const;

// קשרי משפחה ספציפיים
export const relationshipOptions = [
  'אבא',
  'אמא',
  'סבא',
  'סבתא',
  'דוד / דודה',
  'מטופל / מטופלת',
  'אחר'
] as const;

export const genderLabels = {
  male: 'זכר',
  female: 'נקבה',
  prefer_not_to_say: 'מעדיף לא לומר'
} as const;