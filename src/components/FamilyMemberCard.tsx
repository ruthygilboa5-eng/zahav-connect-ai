import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Settings, 
  Check, 
  X, 
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { FamilyMember, scopeLabels } from '@/types/family';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { ScopeSelector } from '@/components/ScopeSelector';
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
  const [isEditingScopes, setIsEditingScopes] = useState(false);
  const { updateMemberStatus, updateMemberScopes, removeFamilyMember } = useFamilyProvider();

  const handleApprove = () => {
    updateMemberStatus(member.id, 'APPROVED');
  };

  const handleReject = () => {
    updateMemberStatus(member.id, 'REVOKED');
  };

  const handleRemove = () => {
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
              
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <span className="text-sm">{member.relation}</span>
                <span className="text-sm">•</span>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="text-sm">{member.phone}</span>
                </div>
              </div>

              {/* Scopes */}
              {member.status === 'APPROVED' && (
                <div className="mt-3">
                  {isEditingScopes ? (
                    <div className="space-y-3">
                      <ScopeSelector 
                        selectedScopes={member.scopes}
                        onScopesChange={(scopes) => {
                          updateMemberScopes(member.id, scopes);
                          setIsEditingScopes(false);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setIsEditingScopes(false)}
                          variant="outline"
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
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
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
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
                    <DropdownMenuItem onClick={() => setIsEditingScopes(true)}>
                      <Settings className="w-4 h-4 ml-2" />
                      עדכן הרשאות
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