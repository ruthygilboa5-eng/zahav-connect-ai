import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useDisplayName } from '@/hooks/useDisplayName';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const WaitingApprovalPage = () => {
  const { authState } = useAuth();
  const displayName = useDisplayName();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [permissionRequest, setPermissionRequest] = useState<any>(null);

  useEffect(() => {
    if (authState.user?.id) {
      loadPermissionRequest();
    }
  }, [authState.user?.id]);

  const loadPermissionRequest = async () => {
    try {
      // Find the current user's family link id first
      const { data: link, error: linkErr } = await supabase
        .from('family_links')
        .select('id')
        .eq('member_user_id', authState.user?.id!)
        .maybeSingle();
      if (linkErr) throw linkErr;
      if (!link?.id) {
        setPermissionRequest(null);
        return;
      }

      const { data, error } = await supabase
        .from('permissions_requests')
        .select('*')
        .eq('family_member_id', link.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      setPermissionRequest(data);

      // If approved, redirect to family dashboard
      if (data?.status === 'APPROVED') {
        toast({
          title: 'אושר!',
          description: 'הבקשה שלך אושרה. מעבר לדשבורד המשפחה...',
        });
        navigate('/family', { replace: true });
      }
    } catch (error) {
      console.error('Error loading permission request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-6 w-6 text-orange-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'DECLINED':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'ממתין לאישור';
      case 'APPROVED':
        return 'אושר';
      case 'DECLINED':
        return 'נדחה';
      default:
        return 'לא ידוע';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 rtl-text">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>טוען...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 rtl-text">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            שלום, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            סטטוס הבקשה שלך לחיבור למשפחה
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {permissionRequest && getStatusIcon(permissionRequest.status)}
              <span>סטטוס הבקשה</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {permissionRequest ? (
              <>
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">
                    {getStatusText(permissionRequest.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    נשלח: {new Date(permissionRequest.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>

                {permissionRequest.status === 'PENDING' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-2">
                      הבקשה נשלחה בהצלחה
                    </h3>
                    <p className="text-orange-700 text-sm">
                      הבקשה שלך לחיבור למשפחה נשלחה למשתמש הראשי. 
                      ברגע שהבקשה תאושר, תוכל לגשת לדשבורד המשפחה ולהתחיל להשתמש במערכת.
                    </p>
                  </div>
                )}

                {permissionRequest.status === 'DECLINED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">
                      הבקשה נדחתה
                    </h3>
                    <p className="text-red-700 text-sm">
                      הבקשה שלך לחיבור למשפחה נדחתה. 
                      נא פנה למשתמש הראשי לקבלת פרטים נוספים.
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadPermissionRequest}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    רענן סטטוס
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  לא נמצאה בקשת חיבור. נא צור קשר עם המשתמש הראשי.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitingApprovalPage;