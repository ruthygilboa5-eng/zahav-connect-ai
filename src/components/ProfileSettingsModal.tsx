import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { authState, logout } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setProfileData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || ''
      });
    }
  }, [isOpen, profile]);

  const handleUpdateProfile = async () => {
    try {
      const success = await updateProfile(profileData);
      if (success) {
        setIsEditing(false);
        toast({
          title: "הצלחה",
          description: "הפרופיל עודכן בהצלחה"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה", 
        description: "לא ניתן לעדכן את הפרופיל",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">הגדרות פרופיל</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטים אישיים
              </CardTitle>
              <CardDescription>
                {isEditing ? "ערוך את הפרטים שלך" : "הפרטים האישיים שלך"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              
              <div className="flex gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdateProfile} size="sm">
                      שמור
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

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}