import { Badge } from '@/components/ui/badge';
import { useFamilyProvider } from '@/providers/FamilyProvider';

const NotificationBadge = () => {
  const { pendingQueue } = useFamilyProvider();
  
  const pendingCount = pendingQueue.filter(item => 
    !item.status || item.status === 'PENDING'
  ).length;

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