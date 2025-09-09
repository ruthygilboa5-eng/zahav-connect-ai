import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthDisplayName } from '@/hooks/useDisplayName';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const displayName = useAuthDisplayName();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin-login');
      toast({
        title: 'התנتקת בהצלחה',
        description: 'הפגישה הופסקה בבטחה',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהתנתקות',
        variant: 'destructive'
      });
    }
  };

  const firstName = displayName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ברוכה הבאה למערכת הניהול! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium text-primary">
              שלום {firstName}, התחברת בהצלחה כמנהלת המערכת
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              ברוכה הבאה לממשק הניהול המרכזי
            </p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm mb-3">פעולות התחלתיות מומלצות:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>בדיקת נתוני משתמשים ובני משפחה</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>טיפול בבקשות הצטרפות פתוחות</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span>ניהול הרשאות משתמשים</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={onClose}
              className="flex-1"
            >
              כניסה לדשבורד
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              התנתקות
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};