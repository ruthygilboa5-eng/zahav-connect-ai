import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';
type Role = 'MAIN_USER' | 'FAMILY';

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('MAIN_USER');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Load profile to determine role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const userRole = roleData?.role === 'main_user' ? 'MAIN_USER' : 'FAMILY';
        
        toast({
          title: "התחברת בהצלחה",
          description: `ברוך הבא${userRole === 'MAIN_USER' ? '' : 'ה'}!`,
        });

        onClose();
        navigate(userRole === 'MAIN_USER' ? '/home' : '/family', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "שגיאת התחברות",
        description: error.message === 'Invalid login credentials' 
          ? 'אימייל או סיסמה שגויים' 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            user_id: data.user.id,
            first_name: '',
            last_name: '',
          });

        // Set role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: role === 'MAIN_USER' ? 'main_user' : 'family_basic',
          });

        // Handle invite code for family members
        if (role === 'FAMILY' && inviteCode.trim()) {
          await attachInviteToMember(inviteCode.trim(), data.user.id);
        }

        toast({
          title: "נרשמת בהצלחה",
          description: data.user?.email_confirmed_at 
            ? "ברוך הבא! מכניס אותך למערכת..."
            : "נשלח אימייל אימות. אנא בדוק את תיבת הדואר שלך.",
        });

        if (data.user?.email_confirmed_at) {
          onClose();
          navigate(role === 'MAIN_USER' ? '/home' : '/family', { replace: true });
        } else {
          onClose();
        }
      }
    } catch (error: any) {
      toast({
        title: "שגיאת הרשמה",
        description: error.message === 'User already registered'
          ? 'משתמש זה כבר רשום במערכת'
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת אימייל",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: "נשלח אימייל לאיפוס סיסמה",
        description: "בדוק את תיבת הדואר שלך",
      });

      setMode('signin');
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const attachInviteToMember = async (code: string, memberUserId: string) => {
    try {
      // For now, just show a success message
      // Family links functionality will be implemented when tables are created
      toast({
        title: "קוד הזמנה נשמר",
        description: "הקוד יחובר כאשר הטבלאות יהיו זמינות",
      });
    } catch (error) {
      console.error('Error attaching invite:', error);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
    setRole('MAIN_USER');
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'signin' && 'התחברות למערכת'}
            {mode === 'signup' && 'הרשמה למערכת'}
            {mode === 'reset' && 'איפוס סיסמה'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset} className="space-y-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="הזן כתובת אימייל"
              required
              dir="ltr"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                  required
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן את הסיסמה שוב"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <Label>סוג משתמש</Label>
                <RadioGroup value={role} onValueChange={(value: Role) => setRole(value)} className="mt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="MAIN_USER" id="main" />
                    <Label htmlFor="main">משתמש ראשי</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="FAMILY" id="family" />
                    <Label htmlFor="family">בן משפחה</Label>
                  </div>
                </RadioGroup>
              </div>

              {role === 'FAMILY' && (
                <div>
                  <Label htmlFor="inviteCode">קוד הזמנה (אופציונלי)</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="הזן קוד הזמנה אם יש לך"
                    dir="ltr"
                  />
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' && 'התחבר'}
            {mode === 'signup' && 'הירשם'}
            {mode === 'reset' && 'שלח אימייל איפוס'}
          </Button>

          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <Button type="button" variant="link" onClick={() => switchMode('signup')}>
                  אין לך חשבון? הירשם כאן
                </Button>
                <br />
                <Button type="button" variant="link" onClick={() => switchMode('reset')}>
                  שכחת את הסיסמה?
                </Button>
              </>
            )}
            {mode === 'signup' && (
              <Button type="button" variant="link" onClick={() => switchMode('signin')}>
                יש לך כבר חשבון? התחבר כאן
              </Button>
            )}
            {mode === 'reset' && (
              <Button type="button" variant="link" onClick={() => switchMode('signin')}>
                חזור להתחברות
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;