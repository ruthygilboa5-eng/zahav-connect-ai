import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoHome } from '@/hooks/useGoHome';

interface ConsentDetails {
  id: string;
  token: string;
  contact_id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  expires_at: string;
  contact: {
    full_name: string;
    owner_user_id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

const EmergencyApprovalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const goHome = useGoHome();
  
  const [consent, setConsent] = useState<ConsentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('קישור לא תקין - חסר טוקן');
      setLoading(false);
      return;
    }

    fetchConsentDetails();
  }, [token]);

  const fetchConsentDetails = async () => {
    if (!token) return;

    try {
      const { data, error } = await supabase
        .from('emergency_consents')
        .select(`
          *,
          contact:contacts(
            full_name,
            owner_user_id,
            profile:user_profiles!contacts_owner_user_id_fkey(
              first_name,
              last_name
            )
          )
        `)
        .eq('token', token)
        .single();

      if (error) {
        console.error('Error fetching consent:', error);
        setError('לא ניתן לטעון פרטי בקשה');
        return;
      }

      if (!data) {
        setError('בקשה לא נמצאה');
        return;
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('הקישור פג תוקף');
        return;
      }

      // Check if already processed
      if (data.status !== 'PENDING') {
        setConsent(data as any);
        return;
      }

      setConsent(data as any);
    } catch (error) {
      console.error('Error:', error);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!consent || !token) return;

    setProcessing(true);
    
    try {
      const newStatus = approved ? 'APPROVED' : 'DECLINED';
      
      // Update consent status
      const { error: consentError } = await supabase
        .from('emergency_consents')
        .update({ status: newStatus })
        .eq('token', token);

      if (consentError) throw consentError;

      // Update contact emergency status
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ emergency_status: newStatus })
        .eq('id', consent.contact_id);

      if (contactError) throw contactError;

      // Update local state
      setConsent(prev => prev ? { ...prev, status: newStatus } : null);

      toast({
        title: approved ? "אושר בהצלחה" : "נדחה בהצלחה",
        description: approved 
          ? "אתה כעת רשום כאיש קשר חירום" 
          : "הבקשה נדחתה בהצלחה",
      });

    } catch (error) {
      console.error('Error updating consent:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הבקשה",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">טוען פרטי בקשה...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">שגיאה</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={goHome} variant="outline">
              חזור לעמוד הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">לא נמצאו פרטי בקשה</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadyProcessed = consent.status !== 'PENDING';
  const isApproved = consent.status === 'APPROVED';
  const isDeclined = consent.status === 'DECLINED';

  return (
    <div className="flex items-center justify-center min-h-screen p-4 rtl-text">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">ZAHAV</h1>
          </div>
          <p className="text-muted-foreground">בקשת אישור לאיש קשר חירום</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
              בקשה מ{consent.contact?.profile?.first_name} {consent.contact?.profile?.last_name}
            </CardTitle>
            <CardDescription>
              {consent.contact?.full_name} ביקש/ה לרשום אותך כאיש קשר חירום
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Display */}
            {isAlreadyProcessed && (
              <Alert className={isApproved ? "border-green-500" : "border-red-500"}>
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <ShieldX className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {isApproved 
                      ? "כבר אישרת את הבקשה - אתה רשום כאיש קשר חירום"
                      : "כבר דחית את הבקשה"
                    }
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Information */}
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">מה זה אומר?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• תקבל התראות SOS במקרה חירום</li>
                  <li>• תופיע ברשימת החיוג המהיר</li>
                  <li>• תוכל לבטל את האישור בכל עת</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            {!isAlreadyProcessed && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproval(true)}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  אשר
                </Button>
                <Button
                  onClick={() => handleApproval(false)}
                  disabled={processing}
                  variant="outline"
                  className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <ShieldX className="w-4 h-4 mr-2" />
                  דחה
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                מערכת ZAHAV - משפחתי
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyApprovalPage;