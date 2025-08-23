import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { scopeLabels, FamilyPermissionRequest } from '@/types/family';

const PermissionRequestsSection = () => {
  const { toast } = useToast();
  const { requests, loading, approveRequest, declineRequest, refresh } = usePermissionRequests();
  const { familyMembers } = useFamilyProvider();
  const [pendingRequests, setPendingRequests] = useState<FamilyPermissionRequest[]>([]);

  useEffect(() => {
    setPendingRequests(requests.filter(req => req.status === 'PENDING'));
  }, [requests]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId);
      toast({
        title: 'בקשה אושרה',
        description: 'ההרשאה הוענקה לבן המשפחה'
      });
      refresh();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה באישור הבקשה',
        variant: 'destructive'
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
      toast({
        title: 'בקשה נדחתה',
        description: 'הבקשה להרשאה נדחתה'
      });
      refresh();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בדחיית הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getMemberName = (familyLinkId: string) => {
    const member = familyMembers.find(m => m.id === familyLinkId);
    return member?.fullName || 'בן משפחה';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">טוען בקשות...</p>
        </div>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>אין בקשות הרשאות ממתינות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <Card key={request.id} className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {getMemberName(request.familyLinkId)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    מבקש הרשאה עבור: {scopeLabels[request.scope]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    נשלח: {new Date(request.createdAt).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Clock className="w-3 h-3 ml-1" />
                  ממתין לטיפול
                </Badge>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(request.id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                אשר
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecline(request.id)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 ml-2" />
                דחה
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PermissionRequestsSection;