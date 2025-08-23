import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Phone, User, Building2, Users, UserCog, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMockSupabase } from '@/hooks/useMockSupabase';
import { useAuth } from '@/providers/AuthProvider';
import { FamilyMember, relationOptions } from '@/types/family';
import { useToast } from '@/hooks/use-toast';

interface NewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSettingsModal({ isOpen, onClose }: NewSettingsModalProps) {
  const { authState, logout, setFirstName } = useAuth();
  const { toast } = useToast();
  const { 
    getProfile, 
    updateProfile, 
    listFamilyLinks, 
    inviteFamilyLink, 
    setFamilyLinkStatus,
    updateFamilyLink,
    loading 
  } = useMockSupabase();

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [profile, members] = await Promise.all([
        getProfile(),
        listFamilyLinks()
      ]);
      
      setProfileData(profile);
      setFamilyMembers(members);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הנתונים",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(profileData);
      // Sync firstName with auth state for immediate header update
      if (profileData.first_name) {
        setFirstName(profileData.first_name);
      }
      setIsEditing(false);
      toast({
        title: "הצלחה",
        description: "הפרופיל עודכן בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה", 
        description: "לא ניתן לעדכן את הפרופיל",
        variant: "destructive"
      });
    }
  };

  const handleApproveFamily = async (memberId: string) => {
    try {
      await setFamilyLinkStatus(memberId, 'APPROVED');
      await loadData();
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
      await setFamilyLinkStatus(memberId, 'REVOKED');
      await loadData();
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

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">מאושר</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">ממתין לאישור</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive">מבוטל</Badge>;
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
          <DialogTitle className="text-2xl font-bold text-center">הגדרות חשבון</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-2">
          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרופיל אישי
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
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.last_name || 'לא צוין'}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">טלפון</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="050-1234567"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.phone || 'לא צוין'}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">אימייל</Label>
                    {isEditing ? (
                      <Input
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@email.com"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                        {profileData.email || 'לא צוין'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
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
                      ערוך פרופיל
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Family Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  בני משפחה ({familyMembers?.length || 0})
                </CardTitle>
                <CardDescription>
                  ניהול בני המשפחה שלך
                </CardDescription>  
              </CardHeader>
              <CardContent>
                {!familyMembers || familyMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>לא נוספו בני משפחה עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Heart className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.relation}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {member.phone}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                הרשאות: {member.scopes.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(member.status)}
                            {member.status === 'PENDING' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveFamily(member.id)}
                              >
                                אשר
                              </Button>
                            )}
                            {member.status === 'APPROVED' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleRevokeFamily(member.id)}
                              >
                                בטל הרשאות
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>פעולות חשבון</CardTitle>
                <CardDescription>
                  פעולות נוספות על החשבון שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">משתמש מחובר</div>
                      <div className="text-sm text-muted-foreground">
                        {authState.firstName} ({authState.role === 'MAIN_USER' ? 'משתמש ראשי' : 'בן משפחה'})
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    התנתק מהחשבון
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