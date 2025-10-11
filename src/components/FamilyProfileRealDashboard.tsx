import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { ArrowRight, Save, User, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface FamilyMemberData {
  id: string;
  full_name: string;
  relationship_to_primary_user: string;
  gender: string;
  email: string;
  phone?: string;
  owner_user_id: string;
}

interface MainUserProfile {
  first_name: string;
  last_name: string;
  display_name?: string;
  email?: string;
}

interface Permission {
  id: string;
  feature: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const FamilyProfileRealDashboard = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    requestPermission, 
    getPermissionStatus, 
    loading: permissionsLoading,
    permissions 
  } = useFamilyPermissions();
  const [memberData, setMemberData] = useState<FamilyMemberData | null>(null);
  const [mainUserProfile, setMainUserProfile] = useState<MainUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    relationship_to_primary_user: '',
    gender: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadMemberData();
  }, [authState.user?.id]);

  const loadMemberData = async () => {
    if (!authState.user?.id) {
      // Demo/unauthenticated fallback so the page doesn't hang on loading
      const demoLink: FamilyMemberData = {
        id: 'demo',
        full_name: 'בן משפחה',
        relationship_to_primary_user: 'בן',
        gender: 'male',
        email: 'family@example.com',
        phone: '',
        owner_user_id: 'demo-owner'
      };

      setMemberData(demoLink);
      setFormData({
        full_name: demoLink.full_name,
        relationship_to_primary_user: demoLink.relationship_to_primary_user,
        gender: demoLink.gender,
        email: demoLink.email,
        phone: demoLink.phone || ''
      });
      setMainUserProfile({ first_name: 'משתמש', last_name: 'ראשי', display_name: 'משתמש ראשי' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')
        .select('*')
        .eq('member_user_id', authState.user.id)
        .maybeSingle();

      if (linkError) {
        console.error('Error loading family link:', linkError);
        toast({
          title: 'שגיאה',
          description: 'שגיאה בטעינת נתוני בן המשפחה',
          variant: 'destructive'
        });
        return;
      }

      setMemberData(familyLink);
      
      // Get main user profile with proper name handling
      if (familyLink.owner_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, display_name, email')
          .eq('user_id', familyLink.owner_user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading main user profile:', profileError);
        } else if (profileData) {
          setMainUserProfile({
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            display_name: profileData.display_name || `${profileData.first_name} ${profileData.last_name}`.trim(),
            email: profileData.email
          });
        } else {
          // No profile found - create a fallback
          setMainUserProfile({
            first_name: 'משתמש',
            last_name: 'ראשי',
            display_name: 'משתמש ראשי',
            email: undefined
          });
        }
      }

      setFormData({
        full_name: familyLink.full_name || '',
        relationship_to_primary_user: familyLink.relationship_to_primary_user || familyLink.relation || '',
        gender: familyLink.gender || '',
        email: familyLink.email || '',
        phone: familyLink.phone || ''
      });

    } catch (error) {
      console.error('Error loading member data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני בן המשפחה',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!memberData?.id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('family_links')
        .update({
          full_name: formData.full_name,
          relationship_to_primary_user: formData.relationship_to_primary_user,
          relation: formData.relationship_to_primary_user, // Update both fields for compatibility
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberData.id);

      if (error) throw error;

      toast({
        title: 'נשמר בהצלחה',
        description: 'פרטי הפרופיל עודכנו בהצלחה'
      });

      // Reload data to reflect changes
      await loadMemberData();

    } catch (error: any) {
      console.error('Error saving member data:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת הפרטים',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFeatureDisplayName = (feature: string) => {
    const names: Record<string, string> = {
      'memories': 'זכרונות',
      'reminders': 'תזכורות',
      'games': 'משחקים',
      'chat': 'צ\'ט משפחתי',
      'emergency': 'התראות חירום',
      'wakeup': 'התעוררות'
    };
    return names[feature] || feature;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-600">ממתין לאישור</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-600 bg-green-100">אושר ✔️</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-red-600">נדחה ❌</Badge>;
      default:
        return <Badge variant="outline">לא התבקש</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">שגיאה</CardTitle>
            <CardDescription>
              לא נמצאו נתוני בן משפחה
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Real Mode Banner */}
      <div className="w-full bg-green-50 border-b border-green-200 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-green-800 font-medium">
            🟢 מצב אמיתי – עריכת פרופיל אמיתי
          </p>
        </div>
      </div>

      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">פרופיל אישי</h1>
            <p className="text-muted-foreground">
              עדכן את פרטיך האישיים
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/family-real')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזור לדשבורד
          </Button>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטים אישיים
            </CardTitle>
            <CardDescription>
              עדכן את פרטיך האישיים כאן
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="הכנס את שמך המלא"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="הכנס כתובת אימייל"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">קשר משפחתי</Label>
                <Select 
                  value={formData.relationship_to_primary_user} 
                  onValueChange={(value) => handleInputChange('relationship_to_primary_user', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קשר משפחתי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="בן">בן</SelectItem>
                    <SelectItem value="בת">בת</SelectItem>
                    <SelectItem value="נכד">נכד</SelectItem>
                    <SelectItem value="נכדה">נכדה</SelectItem>
                    <SelectItem value="אח">אח</SelectItem>
                    <SelectItem value="אחות">אחות</SelectItem>
                    <SelectItem value="בן דוד">בן דוד</SelectItem>
                    <SelectItem value="בת דודה">בת דודה</SelectItem>
                    <SelectItem value="חבר">חבר</SelectItem>
                    <SelectItem value="חברה">חברה</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">מגדר</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מגדר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">זכר</SelectItem>
                    <SelectItem value="female">נקבה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="הכנס מספר טלפון"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/family-real')}
              >
                ביטול
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main User Connection Info */}
        {mainUserProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                משויך לחשבון של
              </CardTitle>
              <CardDescription>
                פרטי המשתמש הראשי שאליו אתה משויך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-lg font-medium">{
                      mainUserProfile.display_name || 
                      `${mainUserProfile.first_name} ${mainUserProfile.last_name}`.trim() ||
                      'לא הוזן'
                    }</p>
                    {mainUserProfile.email && (
                      <p className="text-sm text-muted-foreground">{mainUserProfile.email}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  אתה מחובר כבן משפחה למשתמש זה ויכול לבקש הרשאות לפיצ'רים השונים
                </p>
                <p className="text-sm"><strong>קשר משפחתי:</strong> {memberData.relationship_to_primary_user || formData.relationship_to_primary_user || 'לא הוגדר'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              הרשאות המערכת
            </CardTitle>
            <CardDescription>
              כאן תוכל לראות את סטטוס ההרשאות שלך ולבקש הרשאות חדשות
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['memories', 'reminders', 'games', 'chat', 'emergency', 'wakeup'].map((feature) => {
                const status = getPermissionStatus(feature);
                return (
                  <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{getFeatureDisplayName(feature)}</p>
                        <p className="text-sm text-muted-foreground">
                          גישה לפיצ'ר {getFeatureDisplayName(feature)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                      {status === 'rejected' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => requestPermission(feature)}
                          disabled={permissionsLoading}
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          בקש שוב
                        </Button>
                      )}
                      {status === 'none' && (
                        <Button 
                          size="sm" 
                          onClick={() => requestPermission(feature)}
                          disabled={permissionsLoading}
                        >
                          בקש הרשאה
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default FamilyProfileRealDashboard;