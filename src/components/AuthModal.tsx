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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('MAIN_USER');
  const [ownerPhone, setOwnerPhone] = useState('');
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
        // Load profile to get role + firstName
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const displayName = profile?.first_name || 'משתמש';
        
        if (!roleData) {
          toast({
            title: "שגיאה",
            description: "סוג משתמש לא תקין",
            variant: "destructive",
          });
          return;
        }

        const userRole = roleData.role;
        
        toast({
          title: "התחברת בהצלחה",
          description: `ברוך הבא ${displayName}!`,
        });

        onClose();
        
        // Navigate based on role
        if (userRole === 'main_user') {
          navigate('/dashboard', { replace: true });
        } else if (userRole === 'family_basic') {
          navigate('/family', { replace: true });
        } else {
          toast({
            title: "שגיאה",
            description: "סוג משתמש לא תקין",
            variant: "destructive",
          });
        }
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
    
    // Validation
    if (!firstName.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין שם פרטי",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    if (role === 'MAIN_USER' && !phone.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין מספר טלפון",
        variant: "destructive",
      });
      return;
    }

    if (role === 'FAMILY' && !ownerPhone.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין מספר טלפון של המשתמש הראשי שאליו אתה שייך",
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
        const uid = data.user.id;

        // 1) Create profile
        await supabase
          .from('user_profiles')
          .upsert({
            id: uid,
            user_id: uid,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: role === 'MAIN_USER' ? phone.trim() : null,
          });

        // 2) Set role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: uid,
            role: role === 'MAIN_USER' ? 'main_user' : 'family_basic',
          });

        if (role === 'MAIN_USER') {
          // Ready; route to /dashboard
          toast({
            title: "נרשמת בהצלחה",
            description: `ברוך הבא ${firstName}! מכניס אותך למערכת...`,
          });
          onClose();
          navigate('/dashboard', { replace: true });
          return;
        }

        // 3) FAMILY: find primary user by phone and create permission request
        await handleFamilyPermissionRequest(uid, ownerPhone.trim(), firstName.trim(), email);

        toast({
          title: "נרשמת בהצלחה",
          description: "הבקשה נשלחה, ממתין לאישור",
        });
        onClose();
        navigate('/waiting-approval', { replace: true });
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

  const handleFamilyPermissionRequest = async (memberUserId: string, ownerPhone: string, memberName: string, memberEmail: string) => {
    try {
      // Find primary user by phone
      const { data: primaryUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('phone', ownerPhone)
        .maybeSingle();

      if (!primaryUser) {
        throw new Error('מספר טלפון לא נמצא. בדוק עם בן המשפחה שלך');
      }

      // Create permission request
      await supabase
        .from('permissions_requests')
        .insert({
          primary_user_id: primaryUser.user_id,
          family_member_id: memberUserId,
          family_member_name: memberName,
          family_member_email: memberEmail,
          status: 'PENDING',
          requested_permissions: [],
        });
    } catch (error) {
      console.error('Error creating permission request:', error);
      throw error;
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


  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setOwnerPhone('');
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
                <Label htmlFor="firstName">שם פרטי*</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="הזן שם פרטי"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">שם משפחה</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="הזן שם משפחה (אופציונלי)"
                />
              </div>

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
                    <Label htmlFor="main">אני משתמש ראשי</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="FAMILY" id="family" />
                    <Label htmlFor="family">אני בן משפחה</Label>
                  </div>
                </RadioGroup>
              </div>

              {role === 'MAIN_USER' && (
                <div>
                  <Label htmlFor="phone">מספר טלפון*</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="הזן מספר טלפון"
                    required
                    dir="ltr"
                  />
                </div>
              )}

              {role === 'FAMILY' && (
                <div>
                  <Label htmlFor="ownerPhone">הכנס את מספר הטלפון של המשתמש הראשי שאליו אתה שייך*</Label>
                  <Input
                    id="ownerPhone"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="הזן מספר טלפון של המשתמש הראשי"
                    required
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