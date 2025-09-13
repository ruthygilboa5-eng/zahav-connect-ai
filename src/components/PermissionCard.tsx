import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  MessageSquare, 
  Calendar, 
  Gamepad2, 
  Bell,
  Users,
  Home
} from 'lucide-react';

interface PermissionCardProps {
  feature: string;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  onRequestPermission: () => void;
  disabled?: boolean;
}

const featureLabels: Record<string, string> = {
  wakeup: 'שירות השכמה',
  memories: 'זיכרונות ותמונות',
  games: 'משחקים',
  reminders: 'תזכורות',
  emergency: 'שירותי חירום',
  contacts: 'אנשי קשר',
  family_board: 'לוח המשפחה'
};

const featureIcons: Record<string, any> = {
  wakeup: Bell,
  memories: Camera,
  games: Gamepad2,
  reminders: Calendar,
  emergency: Shield,
  contacts: Users,
  family_board: Home
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return { 
        text: 'הגישה אושרה ✓', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      };
    case 'pending':
      return { 
        text: 'ממתין לאישור', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      };
    case 'rejected':
      return { 
        text: 'הגישה נדחתה ✗', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      };
    default:
      return { 
        text: 'לא מורשה', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Shield
      };
  }
};

const PermissionCard: React.FC<PermissionCardProps> = ({ 
  feature, 
  status, 
  onRequestPermission, 
  disabled 
}) => {
  const featureName = featureLabels[feature] || feature;
  const IconComponent = featureIcons[feature] || Shield;
  const statusBadge = getStatusBadge(status);
  const StatusIcon = statusBadge.icon;

  const getButtonText = () => {
    switch (status) {
      case 'none':
        return 'בקש הרשאה';
      case 'pending':
        return 'בקשה נשלחה';
      case 'rejected':
        return 'בקש שוב';
      case 'approved':
        return 'גישה מאושרת';
      default:
        return 'בקש הרשאה';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'pending':
        return 'הבקשה נשלחה למשתמש הראשי ומחכה לאישור';
      case 'approved':
        return 'יש לך גישה מלאה לפיצ\'ר זה';
      case 'rejected':
        return 'הבקשה נדחתה. ניתן לבקש שוב בכל עת';
      default:
        return 'פיצ\'ר זה דורש הרשאה מהמשתמש הראשי';
    }
  };

  const isButtonDisabled = disabled || status === 'pending' || status === 'approved';

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">{featureName}</CardTitle>
            </div>
          </div>
          <Badge className={statusBadge.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusBadge.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="mb-4 text-sm">
          {getDescription()}
        </CardDescription>
        
        <Button
          onClick={onRequestPermission}
          disabled={isButtonDisabled}
          variant={status === 'approved' ? 'default' : 'outline'}
          className="w-full"
          size="sm"
        >
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PermissionCard;