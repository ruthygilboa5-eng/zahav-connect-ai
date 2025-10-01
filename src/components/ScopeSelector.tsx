import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FamilyScope, scopeLabels } from '@/types/family';
import { Card, CardContent } from '@/components/ui/card';

interface ScopeSelectorProps {
  selectedScopes: FamilyScope[];
  onScopesChange: (scopes: FamilyScope[]) => void;
  disabled?: boolean;
}

export const ScopeSelector = ({ 
  selectedScopes, 
  onScopesChange, 
  disabled = false 
}: ScopeSelectorProps) => {
  const allScopes: FamilyScope[] = ['POST_MEDIA', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT', 'EMERGENCY_ONLY', 'WAKE_UP_NOTIFICATION'];

  const handleScopeChange = (scope: FamilyScope, checked: boolean) => {
    if (checked) {
      // Add scope if not already present
      if (Array.isArray(selectedScopes) && !selectedScopes.includes(scope)) {
        onScopesChange([...selectedScopes, scope]);
      } else if (!Array.isArray(selectedScopes)) {
        onScopesChange([scope]);
      }
    } else {
      // Remove scope
      if (Array.isArray(selectedScopes)) {
        onScopesChange(selectedScopes.filter(s => s !== scope));
      }
    }
  };

  const getScopeDescription = (scope: FamilyScope): string => {
    const descriptions = {
      POST_MEDIA: 'בן המשפחה יוכל להעלות תמונות, וידאו וסיפורים שיגיעו לאישור',
      SUGGEST_REMINDER: 'בן המשפחה יוכל להציע תזכורות שיגיעו לאישור',
      INVITE_GAME: 'בן המשפחה יוכל להזמין למשחקים משותפים',
      CHAT: 'בן המשפחה יוכל להשתתף בצ\'אט המשפחה',
      EMERGENCY_ONLY: 'בן המשפחה יקבל רק התראות חירום, ללא גישה לדשבורד',
      WAKE_UP_NOTIFICATION: 'בן המשפחה יקבל התראה כאשר המשתמש הראשי לוחץ על "התעוררתי" (לאחר אישור)'
    };
    return descriptions[scope];
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-foreground mb-3">בחר הרשאות עבור בן המשפחה:</h4>
      
      <div className="space-y-3">
        {allScopes.map((scope) => (
          <Card key={scope} className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Checkbox
                  id={scope}
                  checked={Array.isArray(selectedScopes) && selectedScopes.includes(scope)}
                  onCheckedChange={(checked) => handleScopeChange(scope, checked as boolean)}
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={scope} 
                    className="text-base font-medium cursor-pointer"
                  >
                    {scopeLabels[scope]}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getScopeDescription(scope)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!Array.isArray(selectedScopes) || selectedScopes.length === 0) && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-700 text-sm">
            יש לבחור לפחות הרשאה אחת כדי שבן המשפחה יוכל להשתמש במערכת.
          </p>
        </div>
      )}
    </div>
  );
};