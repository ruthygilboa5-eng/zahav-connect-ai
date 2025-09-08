
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, Users, Shield, Phone, CheckCircle, X, Clock } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { useOwnerContext } from '@/providers/OwnerProvider';
import { useNavigate } from 'react-router-dom';
import { FamilyScope, FAMILY_SCOPES, scopeLabels } from '@/types/family';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { authState, logout } = useAuth();
  const { profile, updateProfile, loading, loadUserProfile } = useProfile();
  const { familyMembers, updateMemberScopes, updateMemberStatus } = useFamilyProvider();
  const { requests, approveRequest, declineRequest, requestPermission, getRequestStatus } = usePermissionRequests();
  const { ownerUserId } = useOwnerContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen && profile) {
      console.log('Loading profile data:', profile);
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        email: profile.email || ''
      });
      
      // Load owner profile for family members
      if (authState.role === 'FAMILY' && ownerUserId && loadUserProfile) {
        loadUserProfile(ownerUserId).then(setOwnerProfile);
      }
    }
  }, [isOpen, profile, authState.role, ownerUserId, loadUserProfile]);

  const handleUpdateProfile = async () => {
    try {
      console.log('Attempting to update profile with data:', profileData);
      console.log('Auth state:', authState);
      
      if (!authState.user && !authState.isAuthenticated) {
        toast({
          title: "שגיאה",
          description: "לא נמצא משתמש מחובר. אנא התחבר שוב.",
          variant: "destructive"
        });
        return;
      }

      const success = await updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        email: profileData.email
      });

      if (success) {
        setIsEditing(false);
        toast({
          title: "הצלחה",
          description: "הפרופיל עודכן בהצלחה"
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "שגיאה", 
        description: "לא ניתן לעדכן את הפרופיל. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handleScopeToggle = async (memberId: string, scope: FamilyScope, enabled: boolean) => {
    try {
      const member = familyMembers.find(m => m.id === memberId);
      if (!member) return;

      let newScopes;
      if (enabled) {
        newScopes = [...member.scopes, scope];
      } else {
        newScopes = member.scopes.filter(s => s !== scope);
      }

      await updateMemberScopes(memberId, newScopes);
      toast({
        title: "הצלחה",
        description: "הרשאות עודכנו בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את ההרשאות",
        variant: "destructive"
      });
    }
  };

  const handleApproveFamily = async (memberId: string) => {
    try {
      await updateMemberStatus(memberId, 'APPROVED');
      toast({
        title: "הצלחה",
        description: "בן המשפחה אושר בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לאשר את בן המשפחה",
        variant: "destructive"
      });
    }
  };

  const handleRevokeFamily = async (memberId: string) => {
    try {
      await updateMemberStatus(memberId, 'REVOKED');
      toast({
        title: "הצלחה",
        description: "הרשאות בן המשפחה בוטלו"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לבטל את ההרשאות",
        variant: "destructive"
      });
    }
  };

  const handleRequestPermission = async (scope: FamilyScope) => {
    try {
      await requestPermission(scope);
    } catch (error) {
      console.error('Request permission error:', error);
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/', { replace: true });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />מאושר</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />ממתין</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />מבוטל</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center">הגדרות פרופיל</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-2">
          <div className="space-y-6">
            
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרטים אישיים
                </CardTitle>
                <CardDescription>
                  {isEditing ? "ערוך את פרטי החשבון שלך" : "פרטי החשבון שלך"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">שם פרטי</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="הזן שם פרטי"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.first_name || 'לא צוין'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">שם משפחה</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="הזן שם משפחה"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.last_name || 'לא צוין'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">אימייל</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.email || 'לא צוין'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">טלפון נייד</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="050-1234567"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.phone || 'לא צוין'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleUpdateProfile} size="sm">
                        שמור שינויים
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)} 
                        size="sm"
                      >
                        ביטול
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)} 
                      size="sm"
                    >
                      ערוך פרטים
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main User - Family Management */}
            {authState.role === 'MAIN_USER' && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      ניהול בני משפחה ({familyMembers?.length || 0})
                    </CardTitle>
                    <CardDescription>
                      אישור בני משפחה וניהול הרשאותיהם
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!familyMembers || familyMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>לא נוספו בני משפחה עדיין</p>
                        <p className="text-xs mt-2">השתמש בעמוד "ניהול משפחה" להוספת בני משפחה</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {familyMembers.map((member) => (
                          <div key={member.id} className="p-4 border rounded-lg bg-card">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                                 <div>
                                   <div className="font-medium">{member.fullName}</div>
                                   <div className="text-sm text-muted-foreground">{member.relation}</div>
                                   {member.email && (
                                     <div className="text-sm text-muted-foreground font-medium">
                                       אימייל: {member.email}
                                     </div>
                                   )}
                                   <div className="text-sm text-muted-foreground">{member.phone}</div>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(member.status)}
                                {member.status === 'PENDING' && (
                                  <Button size="sm" onClick={() => handleApproveFamily(member.id)}>
                                    אשר בן משפחה
                                  </Button>
                                )}
                                {member.status === 'APPROVED' && (
                                  <Button variant="outline" size="sm" onClick={() => handleRevokeFamily(member.id)}>
                                    בטל הרשאות
                                  </Button>
                                )}
                              </div>
                            </div>

                            {member.status === 'APPROVED' && (
                              <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">הרשאות:</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.values(FAMILY_SCOPES).filter(scope => scope !== 'EMERGENCY_ONLY').map((scope) => (
                                    <div key={scope} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                                      <span className="text-sm">{scopeLabels[scope]}</span>
                                      <Switch
                                        checked={member.scopes.includes(scope)}
                                        onCheckedChange={(checked) => handleScopeToggle(member.id, scope, checked)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permission Requests for Main User */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      בקשות הרשאות ממתינות ({requests.filter(r => r.status === 'PENDING').length})
                    </CardTitle>
                    <CardDescription>
                      בקשות הרשאות מבני המשפחה הממתינות לאישור
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>אין בקשות הרשאות ממתינות</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.filter(r => r.status === 'PENDING').map((request) => {
                          const member = familyMembers.find(m => m.id === request.familyLinkId);
                          return (
                            <div key={request.id} className="p-4 border rounded-lg bg-muted/20">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{member?.fullName || 'לא ידוע'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    מבקש הרשאה: {scopeLabels[request.scope]}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(request.createdAt).toLocaleDateString('he-IL')}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => approveRequest(request.id)}
                                  >
                                    אשר
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => declineRequest(request.id)}
                                  >
                                    דחה
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Family Member - Permission Requests */}
            {authState.role === 'FAMILY' && (
              <>
                <Separator />
                
                {/* Main User Connection Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      פרטי התחברות למשתמש ראשי
                    </CardTitle>
                     <CardDescription>
                       הזיהוי מתבצע לפי כתובת האימייל של המשתמש הראשי
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">מחובר למשתמש ראשי:</div>
                        <div className="text-lg font-bold">
                          אימייל: {ownerProfile?.email || 'לא צוין'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          טלפון: {ownerProfile?.phone || 'לא צוין'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          השם: {ownerProfile?.first_name} {ownerProfile?.last_name}
                        </div>
                        {(!ownerProfile?.phone || ownerProfile.phone === '') && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 mb-2">
                              לא נמצא מספר טלפון למשתמש הראשי
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "פנה למשתמש הראשי",
                                  description: "בקש מהמשתמש הראשי להוסיף מספר טלפון בהגדרות הפרופיל שלו"
                                });
                              }}
                            >
                              איך להוסיף טלפון?
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Other Family Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      בני משפחה אחרים
                    </CardTitle>
                    <CardDescription>
                      בני משפחה אחרים המחוברים לאותו משתמש ראשי
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {familyMembers && familyMembers.filter(m => m.id !== authState.memberId && m.status === 'APPROVED').length > 0 ? (
                      <div className="space-y-3">
                        {familyMembers.filter(m => m.id !== authState.memberId && m.status === 'APPROVED').map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-sm text-muted-foreground">{member.relation}</div>
                            </div>
                            {getStatusBadge(member.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">אין בני משפחה אחרים מחוברים</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      בקשות הרשאות שלי
                    </CardTitle>
                    <CardDescription>
                      בקש הרשאות נוספות או צפה בסטטוס הבקשות שלך
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        אתה יכול לבקש הרשאות נוספות מהמשתמש הראשי. הבקשות יישלחו לאישור.
                      </div>
                      {Object.values(FAMILY_SCOPES).filter(scope => scope !== 'EMERGENCY_ONLY').map((scope) => {
                        const status = getRequestStatus(scope);
                        const hasPermission = status === 'APPROVED';
                        const hasPendingRequest = status === 'PENDING';
                        const wasDeclined = status === 'DECLINED';
                        
                        return (
                          <div key={scope} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{scopeLabels[scope]}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {hasPermission && "✅ יש לך הרשאה זו - יכול לבצע פעולה"}
                                {hasPendingRequest && "⏳ הבקשה נשלחה - ממתין לאישור המשתמש הראשי"}
                                {wasDeclined && "❌ הבקשה נדחתה - ניתן לבקש שוב"}
                                {status === 'NONE' && "💡 הרשאה זו לא נבקשה עדיין"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasPermission && <Badge className="bg-green-500 text-white text-xs">מאושר</Badge>}
                              {hasPendingRequest && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">ממתין</Badge>}
                              {wasDeclined && <Badge variant="destructive" className="text-xs">נדחה</Badge>}
                              {(status === 'NONE' || wasDeclined) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRequestPermission(scope)}
                                  className="text-xs px-3 py-1"
                                >
                                  {wasDeclined ? 'בקש שוב' : 'בקש הרשאה'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium">טיפ:</p>
                            <p>כל בקשה נשלחת למשתמש הראשי לאישור. תוכל לראות את הסטטוס כאן.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Separator />

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>פרטי חשבון</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">סוג משתמש</div>
                      <div className="text-sm text-muted-foreground">
                        {authState.role === 'MAIN_USER' ? 'משתמש ראשי' : 'בן משפחה'}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    התנתק
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
