import React from 'react';
import { FamilyMember } from '@/types/family';
import { FamilyMemberCard } from '@/components/FamilyMemberCard';

interface FamilyMembersListProps {
  members: FamilyMember[];
  showActions?: boolean;
}

export const FamilyMembersList = ({ members, showActions = false }: FamilyMembersListProps) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-lg">
          אין בני משפחה רשומים כרגע
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          השתמש בכפתור "שלח הזמנה" כדי להוסיף בן משפחה
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <FamilyMemberCard 
          key={member.id}
          member={member}
          showActions={showActions}
        />
      ))}
    </div>
  );
};