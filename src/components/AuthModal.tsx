import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Mail, Lock, User, Phone, Shield, CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OTPCountdown } from '@/components/OTPCountdown';
import { OTP_EXPIRY_MINUTES, isOTPExpired } from '@/config/otp';
import { genderLabels } from "@/types/database";
import { useNavigate } from 'react-router-dom';
import { DEV_MODE_DEMO } from '@/config/dev';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'MAIN_USER' | 'FAMILY';
}

export const AuthModal = ({ isOpen, onClose, defaultRole = 'MAIN_USER' }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // OTP Form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Sign Up Form  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say' | ''>('');

const navigate = useNavigate();

  const navigateAfterLogin = async (user: any) => {
    if (!user?.id) return;

    // Check user roles from database
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      navigate('/home', { replace: true });
      return;
    }

    const roles = (rolesData || []).map(r => r.role as string);

    // Check if user is an approved family member (for users without explicit roles)
    const { data: familyLink, error: familyError } = await supabase
      .from('family_links')
      .select('status')
      .eq('member_user_id', user.id)
      .eq('status', 'APPROVED')
      .single();

    // Real users are those who have actual authentication (not demo mode)
    // They should be directed to the -real pages
    const isRealUser = true; // All authenticated users through this modal are real users
    
    // Priority: family_member -> /family-real, then admin -> /admin-dashboard-real, then primary_user -> /home
    if (roles.includes('family_member') || (!familyError && familyLink)) {
      navigate('/family-real', { replace: true });
      return;
    }
    if (roles.includes('admin')) {
      navigate('/admin-dashboard-real', { replace: true });
      return;
    }
    if (roles.includes('primary_user')) {
      navigate('/home', { replace: true });
      return;
    }

    // Default fallback
    navigate('/home', { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: 'התחברות הצליחה',
          description: 'ברוך הבא למערכת!',
        });
        onClose();
        const { data: { user } } = await supabase.auth.getUser();
        await navigateAfterLogin(user);
      }
    } catch (err: any) {
      setError('שגיאה בהתחברות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setOtpSentAt(Date.now());
        setShowOtpInput(true);
        toast({
          title: 'קוד נשלח בהצלחה',
          description: `הקוד תקף ל־${OTP_EXPIRY_MINUTES} דקות`,
        });
      }
    } catch (err: any) {
      setError('שגיאה בשליחת הקוד. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpSentAt || isOTPExpired(otpSentAt)) {
      setError('הקוד פג תוקף, יש לבקש קוד חדש');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: 'התחברות הצליחה',
          description: 'ברוך הבא למערכת!',
        });
        onClose();
        const { data: { user } } = await supabase.auth.getUser();
        await navigateAfterLogin(user);
      }
    } catch (err: any) {
      setError('שגיאה באימות הקוד. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setShowOtpInput(false);
    setOtpCode('');
    setError('');
    handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signUpPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (signUpPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            birth_date: birthDate ? format(birthDate, 'yyyy-MM-dd') : undefined,
            gender: gender || undefined,
          }
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: 'הרשמה הצליחה',
          description: 'בדוק את האימייל שלך לאימות החשבון',
        });
        setActiveTab('signin');
      }
    } catch (err: any) {
      setError('שגיאה בהרשמה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setOtpEmail('');
    setOtpCode('');
    setOtpSentAt(null);
    setShowOtpInput(false);
    setSignUpEmail('');
    setSignUpPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setBirthDate(undefined);
    setGender('');
    setError('');
    setActiveTab('signin');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rtl-text">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            התחברות כ{defaultRole === 'MAIN_USER' ? 'משתמש ראשי' : 'בן משפחה'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">סיסמה</TabsTrigger>
            <TabsTrigger value="otp">קוד OTP</TabsTrigger>
            <TabsTrigger value="signup">הרשמה</TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="mt-4 border-destructive">
              <AlertDescription className="text-right">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">התחברות עם סיסמה</CardTitle>
                <CardDescription className="text-right">
                  הכנס את פרטי ההתחברות שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-right block">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="דוא״ל שלך"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-right block">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="הסיסמה שלך"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מתחבר...
                      </>
                    ) : (
                      'התחבר'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="otp">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">התחברות עם קוד OTP</CardTitle>
                <CardDescription className="text-right">
                  {!showOtpInput 
                    ? 'הכנס את כתובת האימייל שלך לקבלת קוד'
                    : 'הכנס את הקוד שנשלח לאימייל שלך'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showOtpInput ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email" className="text-right block">אימייל</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="דוא״ל שלך"
                          className="pl-10 text-right"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          שולח קוד...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          שלח קוד אימות
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-right block">הכנס את הקוד בן 6 הספרות</Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otpCode}
                          onChange={(value) => setOtpCode(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    {otpSentAt && (
                      <OTPCountdown
                        sentAt={otpSentAt}
                        onResend={handleResendOTP}
                        loading={loading}
                      />
                    )}

                    <Button 
                      onClick={handleVerifyOTP}
                      className="w-full" 
                      disabled={loading || otpCode.length !== 6 || (otpSentAt ? isOTPExpired(otpSentAt) : false)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          מאמת...
                        </>
                      ) : (
                        'אמת קוד'
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtpCode('');
                        setError('');
                      }}
                      className="w-full"
                    >
                      חזור לשליחת קוד
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">הרשמה</CardTitle>
                <CardDescription className="text-right">
                  צור חשבון חדש במערכת זהב
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-right block">שם פרטי</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="first-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="שם פרטי"
                          className="pl-10 text-right"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-right block">שם משפחה</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="last-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="שם משפחה"
                          className="pl-10 text-right"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-right block">טלפון (אופציונלי)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="מספר טלפון"
                        className="pl-10 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right block">תאריך לידה (אופציונלי)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">יום</Label>
                          <Select 
                            value={birthDate ? birthDate.getDate().toString() : ''} 
                            onValueChange={(value) => {
                              if (value && birthDate) {
                                const newDate = new Date(birthDate);
                                newDate.setDate(parseInt(value));
                                setBirthDate(newDate);
                              } else if (value) {
                                setBirthDate(new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(value)));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר/י יום" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">חודש</Label>
                          <Select 
                            value={birthDate ? (birthDate.getMonth() + 1).toString() : ''} 
                            onValueChange={(value) => {
                              if (value && birthDate) {
                                const newDate = new Date(birthDate);
                                newDate.setMonth(parseInt(value) - 1);
                                setBirthDate(newDate);
                              } else if (value) {
                                setBirthDate(new Date(new Date().getFullYear(), parseInt(value) - 1, 1));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר/י חודש" />
                            </SelectTrigger>
                            <SelectContent>
                              {['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                                'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'].map((month, index) => (
                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">שנה</Label>
                          <Select 
                            value={birthDate ? birthDate.getFullYear().toString() : ''} 
                            onValueChange={(value) => {
                              if (value && birthDate) {
                                const newDate = new Date(birthDate);
                                newDate.setFullYear(parseInt(value));
                                setBirthDate(newDate);
                              } else if (value) {
                                setBirthDate(new Date(parseInt(value), 0, 1));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר/י שנה" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 106 }, (_, i) => 2025 - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-right block">מין (אופציונלי)</Label>
                      <Select 
                        value={gender} 
                        onValueChange={(value) => setGender(value as 'male' | 'female' | 'prefer_not_to_say' | '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר מין" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(genderLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-right block">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="דוא״ל שלך"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-right block">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="בחר סיסמה"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-right block">אימות סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="חזור על הסיסמה"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        נרשם...
                      </>
                    ) : (
                      'הירשם'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};