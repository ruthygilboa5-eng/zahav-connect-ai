import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, User, FileText, Bell, Gamepad2 } from 'lucide-react';
import { FamilyMember, PendingItem } from '@/types/family';
import { useFamilyProvider } from '@/providers/FamilyProvider';

interface PendingApprovalsProps {
  pendingMembers: FamilyMember[];
  pendingItems: PendingItem[];
}

export const PendingApprovals = ({ pendingMembers, pendingItems }: PendingApprovalsProps) => {
  const { updateMemberStatus } = useFamilyProvider();
  // TODO: Implement real pending items approval with permissions_requests

  const getItemIcon = (type: PendingItem['type']) => {
    const icons = {
      MEDIA: FileText,
      STORY: FileText,
      REMINDER: Bell,
      GAME_INVITE: Gamepad2,
    };
    return icons[type];
  };

  const getItemTypeLabel = (type: PendingItem['type']) => {
    const labels = {
      MEDIA: 'מדיה',
      STORY: 'סיפור',
      REMINDER: 'תזכורת',
      GAME_INVITE: 'הזמנת משחק',
    };
    return labels[type];
  };

  if (pendingMembers.length === 0 && pendingItems.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">אין פריטים ממתינים לאישור</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Members */}
      {pendingMembers.map((member) => (
        <Card key={member.id} className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">{member.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.relationship_label} • {member.phone}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    הזמנה למשפחה
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateMemberStatus(member.id, 'ACTIVE')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateMemberStatus(member.id, 'INACTIVE')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pending Items */}
      {pendingItems.map((item) => {
        const Icon = getItemIcon(item.type);
        return (
          <Card key={item.id} className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <Badge variant="outline">
                        {getItemTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      מאת: {item.fromMemberName}
                    </p>
                    <p className="text-sm text-foreground line-clamp-2">
                      {item.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      נשלח: {new Date(item.submittedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      // TODO: Implement with permissions_requests
                      console.log('Approve item:', item.id);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      // TODO: Implement with permissions_requests
                      console.log('Reject item:', item.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};