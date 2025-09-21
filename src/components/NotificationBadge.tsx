import { Badge } from '@/components/ui/badge';
import { useFamilyProvider } from '@/providers/FamilyProvider';

const NotificationBadge = () => {
  // TODO: Implement with real permissions_requests data
  const pendingCount = 0; // Mock empty for now

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