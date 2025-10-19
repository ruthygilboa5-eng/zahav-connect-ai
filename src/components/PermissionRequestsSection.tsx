import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { scopeLabels } from '@/types/family';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const PermissionRequestsSection = () => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const { requests, loading, approveRequest, declineRequest, refresh } = usePermissionRequests();
  const { familyMembers } = useFamilyProvider();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [linkNameMap, setLinkNameMap] = useState<Record<string, string>>({});
  const [linkRelationMap, setLinkRelationMap] = useState<Record<string, string>>({});
  const [memberNameMap, setMemberNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setPendingRequests(requests.filter(req => req.status === 'PENDING'));
  }, [requests]);

  // Load family_links: id -> {full_name, relationship_to_primary_user}
  useEffect(() => {
    const loadLinks = async () => {
      if (authState.role !== 'MAIN_USER' || !authState.user?.id) return;
      const { data } = await supabase
        .from('family_links')
        .select('id, full_name, relationship_to_primary_user, relation')
        .eq('owner_user_id', authState.user.id);
      const nameMap: Record<string, string> = {};
      const relationMap: Record<string, string> = {};
      (data || []).forEach((l: any) => { 
        nameMap[l.id] = l.full_name; 
        relationMap[l.id] = l.relationship_to_primary_user || l.relation || '';
      });
      setLinkNameMap(nameMap);
      setLinkRelationMap(relationMap);
    };
    loadLinks();
  }, [authState.role, authState.user?.id]);

  // Additional fallback: map family_members.id -> full_name
  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (authState.role !== 'MAIN_USER' || !authState.user?.id) return;
      const { data } = await supabase
        .from('family_members')
        .select('id, full_name')
        .eq('main_user_id', authState.user.id);
      const map: Record<string, string> = {};
      (data || []).forEach((m: any) => { map[m.id] = m.full_name; });
      setMemberNameMap(map);
    };
    loadFamilyMembers();
  }, [authState.role, authState.user?.id]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId);
      // Remove from pending list immediately
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'בקשה אושרה',
        description: 'הבקשה להרשאה אושרה בהצלחה'
      });
      // Refresh to sync with DB
      await refresh();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לאשר את הבקשה',
        variant: 'destructive'
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
      // Remove from pending list immediately
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'בקשה נדחתה',
        description: 'הבקשה להרשאה נדחתה'
      });
      // Refresh to sync with DB
      await refresh();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לדחות את הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getPermissionLabel = (permissionType: string) => {
    return scopeLabels[permissionType as keyof typeof scopeLabels] || permissionType;
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
                     {(request as any).familyMemberName || linkNameMap[request.familyLinkId] || memberNameMap[request.familyLinkId] || 'בן משפחה לא ידוע'}
                     {linkRelationMap[request.familyLinkId] && (
                       <span className="text-sm font-normal text-muted-foreground mr-2">
                         ({linkRelationMap[request.familyLinkId]})
                       </span>
                     )}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     מבקש הרשאה עבור: {getPermissionLabel(request.scope)}
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