import { Badge } from '@/components/ui/badge';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { useAuth } from '@/providers/AuthProvider';

const NotificationBadge = () => {
  const { authState } = useAuth();
  const { requests } = usePermissionRequests();

  // Only show for main users
  if (authState.role !== 'MAIN_USER') return null;

  // Count pending requests
  const pendingCount = requests.filter(req => req.status === 'PENDING').length;

  if (pendingCount === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
    >
      {pendingCount}
    </Badge>
  );
};

export default NotificationBadge;