import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { 
  Users, 
  Phone, 
  Clock, 
  Check, 
  X, 
  UserPlus,
  Settings
} from 'lucide-react';

interface FamilyLinkRequest {
  id: string;
  full_name: string;
  owner_phone: string | null;
  owner_user_id: string | null;
  member_user_id: string;
  status: string;
  created_at: string;
}

const FamilyLinkRequests = () => {
  const [requests, setRequests] = useState<FamilyLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { authState } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [authState.user]);

  const fetchRequests = async () => {
    try {
      if (!authState.user || authState.role !== 'MAIN_USER') {
        return;
      }

      // Fetch family links that belong to this user by owner_user_id or by matching email
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', authState.user.id)
        .maybeSingle();

      const userEmail = userProfile?.email || authState.user.email;

      const { data, error } = await supabase
        .from('family_links')
        .select('*')
        .or(`owner_user_id.eq.${authState.user.id},owner_email.eq.${userEmail}`)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching family link requests:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את בקשות החיבור',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimLink = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ owner_user_id: authState.user?.id })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'הבקשה שויכה לחשבון שלך',
      });

      fetchRequests();
    } catch (error) {
      console.error('Error claiming link:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשייך את הבקשה',
        variant: 'destructive',
      });
    }
  };

  const handleApproveLink = async (requestId: string) => {
    try {
      const defaultScopes = ['POST_MEDIA', 'POST_STORY', 'SUGGEST_REMINDER', 'INVITE_GAME', 'CHAT'];
      
      const { data, error } = await supabase
        .from('family_links')
        .update({ 
          status: 'APPROVED',
          scopes: defaultScopes
        })
        .eq('id', requestId)
        .select('member_user_id')
        .maybeSingle();

      if (error) throw error;

      // Ensure the approved member has the correct family role
      if (data?.member_user_id) {
        await supabase
          .from('user_roles')
          .upsert(
            [{ user_id: data.member_user_id, role: 'family_member', granted_by_user_id: authState.user?.id || null }],
            { onConflict: 'user_id,role', ignoreDuplicates: true }
          );
      }

      toast({
        title: 'הצלחה',
        description: 'בקשת החיבור אושרה בהצלחה',
      });

      fetchRequests();
    } catch (error) {
      console.error('Error approving link:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לאשר את הבקשה',
        variant: 'destructive',
      });
    }
  };
  const handleRejectLink = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('family_links')
        .update({ status: 'DECLINED' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'הבקשה נדחתה',
        description: 'בקשת החיבור נדחתה',
      });

      fetchRequests();
    } catch (error) {
      console.error('Error rejecting link:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לדחות את הבקשה',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            בקשות חיבור משפחתיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Clock className="w-8 h-8 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            בקשות חיבור משפחתיות
          </CardTitle>
          <CardDescription>
            כאן יופיעו בקשות חיבור מבני משפחה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">אין בקשות חיבור ממתינות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          בקשות חיבור משפחתיות
        </CardTitle>
        <CardDescription>
          אשר או דחה בקשות חיבור מבני משפחה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {request.full_name}
                    </h3>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      ממתין
                    </Badge>
                  </div>
                  
                  {request.owner_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      מחפש חיבור למספר: {request.owner_phone}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    נשלח: {new Date(request.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!request.owner_user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClaimLink(request.id)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    שייך לחשבון שלי
                  </Button>
                )}
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApproveLink(request.id)}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  אשר
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectLink(request.id)}
                  className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-4 h-4" />
                  דחה
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyLinkRequests;