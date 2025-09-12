/**
 * Utility functions for creating gender and relationship-aware messages
 */

export interface UserInfo {
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  relationship_label?: string;
  full_name?: string;
}

/**
 * Get gendered verb forms
 */
export const getGenderedVerbs = (gender?: string) => {
  switch (gender) {
    case 'male':
      return {
        woke_up: 'התעורר',
        sent: 'שלח',
        added: 'הוסיף',
        invited: 'הזמין',
        wrote: 'כתב',
        received: 'קיבל',
        he_she: 'הוא',
        his_her: 'שלו'
      };
    case 'female':
      return {
        woke_up: 'התעוררה',
        sent: 'שלחה',
        added: 'הוסיפה',
        invited: 'הזמינה', 
        wrote: 'כתבה',
        received: 'קיבלה',
        he_she: 'היא',
        his_her: 'שלה'
      };
    default:
      return {
        woke_up: 'התעורר',
        sent: 'שלח',
        added: 'הוסיף',
        invited: 'הזמין',
        wrote: 'כתב',
        received: 'קיבל',
        he_she: 'הוא',
        his_her: 'שלו'
      };
  }
};

/**
 * Create wake-up message
 */
export const createWakeUpMessage = (userInfo: UserInfo): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  const name = userInfo.full_name || relationship;
  
  return `${relationship} שלך עדכן שהוא ${verbs.woke_up} הבוקר 💚`.replace('הוא', verbs.he_she).replace('עדכן', userInfo.gender === 'female' ? 'עדכנה' : 'עדכן');
};

/**
 * Create emergency message
 */
export const createEmergencyMessage = (userInfo: UserInfo, location?: string): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  const locationText = location ? ` מיקום: ${location}` : '';
  
  return `${relationship} שלך ${verbs.sent} הודעת חירום 🚨 ${verbs.he_she} זקוק לעזרה!${locationText}`.replace('זקוק', userInfo.gender === 'female' ? 'זקוקה' : 'זקוק');
};

/**
 * Create reminder message
 */
export const createReminderMessage = (userInfo: UserInfo): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  
  return `${relationship} שלך ${verbs.received} תזכורת חדשה – ${verbs.he_she} ביקש שתוודא/י שיעשה זאת`.replace('ביקש', userInfo.gender === 'female' ? 'ביקשה' : 'ביקש').replace('שיעשה', userInfo.gender === 'female' ? 'שתעשה' : 'שיעשה');
};

/**
 * Create memory message
 */
export const createMemoryMessage = (userInfo: UserInfo): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  
  return `${relationship} שלך ${verbs.added} סיפור חדש 📖`;
};

/**
 * Create game invitation message
 */
export const createGameMessage = (userInfo: UserInfo): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  
  return `${relationship} שלך ${verbs.invited} אותך לשחק 🎲`;
};

/**
 * Create family board message prefix
 */
export const createFamilyBoardPrefix = (userInfo: UserInfo): string => {
  const verbs = getGenderedVerbs(userInfo.gender);
  const relationship = userInfo.relationship_label || 'המשתמש';
  
  return `${relationship} ${verbs.wrote}`;
};

/**
 * Send notification (using real notification system)
 */
export const sendNotification = async (message: string, recipients: string[]) => {
  // Import the hook within the function to avoid circular dependencies
  const { sendNotification: realSendNotification } = await import('@/hooks/useNotifications').then(mod => ({ sendNotification: mod.useNotifications().sendNotification }));
  
  // For now, just log - the actual implementation will be handled by useNotifications hook
  console.log('Sending notification:', message, 'to:', recipients);
  
  // TODO: This will be replaced with actual hook usage in components
  // Components should use useNotifications hook directly instead of this utility
};