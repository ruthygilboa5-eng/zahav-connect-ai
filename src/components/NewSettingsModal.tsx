import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Phone, User, Building2, Users, UserCog, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useContacts } from '@/hooks/useContacts';
import { relationLabels, type Contact } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface NewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewSettingsModal({ isOpen, onClose }: NewSettingsModalProps) {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { contacts, loading: contactsLoading } = useContacts();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    displayName: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || profile.first_name || ''
      });
    }
  }, [profile]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      onClose();
      window.location.reload();
    }
  };

  const getRelationIcon = (relation: string) => {
    switch (relation) {
      case 'FAMILY':
        return <Heart className="h-4 w-4" />;
      case 'INSTITUTION':
        return <Building2 className="h-4 w-4" />;
      case 'NEIGHBOR':
        return <Users className="h-4 w-4" />;
      case 'CAREGIVER':
        return <UserCog className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getEmergencyStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">מאושר</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">ממתין לאישור</Badge>;
      case 'DECLINED':
        return <Badge variant="destructive">נדחה</Badge>;
      default:
        return null;
    }
  };

  if (profileLoading || contactsLoading) {
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
                  פרטי החשבון שלך (לצפייה בלבד)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">שם פרטי</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                      {profileData.firstName || 'לא צוין'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">שם משפחה</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                      {profileData.lastName || 'לא צוין'}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">שם תצוגה</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                      {profileData.displayName || 'לא צוין'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Contacts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  אנשי קשר ({contacts?.length || 0})
                </CardTitle>
                <CardDescription>
                  רשימת אנשי הקשר שלך (לצפייה בלבד)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!contacts || contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>לא נוספו אנשי קשר עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact: Contact) => (
                      <div key={contact.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getRelationIcon(contact.relation)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{contact.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {relationLabels[contact.relation as keyof typeof relationLabels]}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {contact.phone}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {contact.is_emergency_candidate && (
                              <Badge variant="outline" className="text-xs">
                                איש קשר חירום
                              </Badge>
                            )}
                            {contact.emergency_status !== 'NONE' && (
                              <div className="text-xs">
                                {getEmergencyStatusBadge(contact.emergency_status)}
                              </div>
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
                      <div className="font-medium">כתובת אימייל</div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
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