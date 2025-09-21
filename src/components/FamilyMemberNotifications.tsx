import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Bell, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X
} from 'lucide-react';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { scopeLabels } from '@/types/family';

const FamilyMemberNotifications = () => {
  const { allRequests, loading } = useFamilyPermissions();
  const [showNotifications, setShowNotifications] = useState(false);

  // Use real permission requests data
  const notifications = allRequests;

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'אושר';
      case 'rejected':
        return 'נדחה';
      default:
        return 'ממתין';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getFeatureLabel = (feature: string) => {
    return scopeLabels[feature as keyof typeof scopeLabels] || feature;
  };

  const unreadCount = notifications.filter(n => 
    n.status && n.status !== 'pending'
  ).length;

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNotifications(false)}
          />
          <Card className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                התראות
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                >
                  {getStatusIcon(notification.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      בקשה עבור: {getFeatureLabel(notification.feature)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      נשלח: {new Date(notification.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${getStatusColor(notification.status)}`}
                  >
                    {getStatusText(notification.status)}
                  </Badge>
                </div>
              ))}
            </div>

            {notifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  אין התראות חדשות
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default FamilyMemberNotifications;