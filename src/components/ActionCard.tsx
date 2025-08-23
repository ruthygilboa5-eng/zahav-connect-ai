import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { FamilyScope, ScopeStatus } from '@/types/family';
import { useScopeStatus } from '@/hooks/useScopeStatus';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';

interface ActionCardProps {
  scope: FamilyScope;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onAction: () => void;
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  scope,
  title,
  description,
  icon: Icon,
  onAction,
  className = ""
}) => {
  const { toast } = useToast();
  const status = useScopeStatus(scope);
  const { requestPermission } = usePermissionRequests();

  const getStatusBadge = (status: ScopeStatus) => {
    switch (status) {
      case 'APPROVED':
        return { text: 'מאושר', color: 'bg-zahav-green text-white' };
      case 'PENDING':
        return { text: 'ממתין לאישור', color: 'bg-zahav-yellow text-foreground' };
      case 'DECLINED':
        return { text: 'נדחה', color: 'bg-zahav-red text-white' };
      default:
        return { text: 'לא מורשה', color: 'bg-muted text-muted-foreground' };
    }
  };

  const getHintText = (status: ScopeStatus) => {
    switch (status) {
      case 'PENDING':
        return 'הבקשה בבדיקה אצל בעל החשבון';
      case 'DECLINED':
      case 'NONE':
        return 'פעולה זו דורשת הרשאה מבעל החשבון הראשי';
      default:
        return undefined;
    }
  };

  const handleRequestPermission = async () => {
    try {
      await requestPermission(scope);
      toast({
        title: 'בקשתך נשלחה',
        description: 'בקשתך להרשאה נשלחה למשתמש הראשי לאישור'
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשליחת הבקשה',
        variant: 'destructive'
      });
    }
  };

  const handleAction = () => {
    if (status !== 'APPROVED') {
      toast({
        title: 'אין הרשאה',
        description: 'פעולה זו דורשת הרשאה מבעל החשבון הראשי',
        variant: 'destructive'
      });
      return;
    }
    onAction();
  };

  const statusBadge = getStatusBadge(status);
  const hintText = getHintText(status);
  const isApproved = status === 'APPROVED';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with title and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Badge className={statusBadge.color}>
          {statusBadge.text}
        </Badge>
      </div>
      
      {/* Description */}
      <p className="text-xs text-muted-foreground">{description}</p>
      
      {/* Hint text */}
      {hintText && (
        <p className="text-xs text-muted-foreground italic">
          {hintText}
        </p>
      )}
      
      {/* Action buttons */}
      <div className="space-y-1">
        {/* Primary action button */}
        <Button
          variant={isApproved ? "outline" : "ghost"}
          size="sm"
          className="w-full"
          onClick={handleAction}
          disabled={!isApproved}
          title={!isApproved ? "פעולה זו דורשת הרשאה מבעל החשבון הראשי" : undefined}
        >
          {!isApproved && <Lock className="w-4 h-4 ml-2" />}
          {title}
        </Button>
        
        {/* Request permission button */}
        {(status === 'NONE' || status === 'DECLINED') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleRequestPermission}
          >
            {status === 'DECLINED' ? 'בקש שוב' : 'בקש הרשאה'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionCard;