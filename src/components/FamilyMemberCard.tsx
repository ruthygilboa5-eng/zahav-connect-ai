import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Check, 
  X, 
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { FamilyMember, scopeLabels } from '@/types/family';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { useAuth } from '@/providers/AuthProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface FamilyMemberCardProps {
  member: FamilyMember;
  showActions?: boolean;
}

export const FamilyMemberCard = ({ member, showActions = false }: FamilyMemberCardProps) => {
  const { updateMemberStatus, removeFamilyMember } = useFamilyProvider();
  const { authState } = useAuth();

  // Only Main Users can manage family member scopes and actions
  const canManageMembers = authState.role === 'MAIN_USER';

  const handleApprove = () => {
    if (!canManageMembers) return;
    updateMemberStatus(member.id, 'APPROVED');
  };

  const handleReject = () => {
    if (!canManageMembers) return;
    updateMemberStatus(member.id, 'REVOKED');
  };

  const handleRemove = () => {
    if (!canManageMembers) return;
    if (confirm(`האם אתה בטוח שברצונך להסיר את ${member.fullName}?`)) {
      removeFamilyMember(member.id);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      PENDING: { label: 'ממתין לאישור', variant: 'secondary' as const, color: 'text-orange-600' },
      APPROVED: { label: 'מאושר', variant: 'default' as const, color: 'text-green-600' },
      REVOKED: { label: 'נדחה', variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = statusConfig[member.status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {member.fullName}
                </h3>
                {getStatusBadge()}
              </div>
              
              <div className="flex flex-col gap-1 text-muted-foreground mb-2">
                <span className="text-sm">{member.relation}</span>
                {member.email && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">אימייל:</span>
                    <span className="text-sm">{member.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="text-sm">{member.phone}</span>
                </div>
              </div>

              {/* Scopes Display - Read Only for Family Users */}
              {member.status === 'APPROVED' && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">הרשאות:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scopeLabels[scope]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions - Only for Main User */}
          {showActions && canManageMembers && (
            <div className="flex items-center gap-2">
              {member.status === 'PENDING' && (
                <>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {member.status === 'APPROVED' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleReject}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 ml-2" />
                      בטל הרשאות
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleRemove}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 ml-2" />
                      הסר בן משפחה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Invitation Date */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            הוזמן ב: {new Date(member.invitedAt).toLocaleDateString('he-IL')}
            {member.approvedAt && (
              <span className="mr-3">
                אושר ב: {new Date(member.approvedAt).toLocaleDateString('he-IL')}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};