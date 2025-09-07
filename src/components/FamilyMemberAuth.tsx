import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Lock, Shield } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OTPCountdown } from '@/components/OTPCountdown';
import { OTP_EXPIRY_MINUTES, isOTPExpired } from '@/config/otp';
import FamilyMemberSignup from './FamilyMemberSignup';

interface FamilyMemberAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyMemberAuth = ({ isOpen, onClose }: FamilyMemberAuthProps) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [mainUserEmail, setMainUserEmail] = useState('');

  // OTP Form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpMainUserEmail, setOtpMainUserEmail] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!mainUserEmail.trim()) {
      setError('יש למלא את כתובת האימייל של המשתמש הראשי');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        // TODO: Verify family member connection to main user
        toast({
          title: 'התחברות הצליחה',
          description: 'ברוך הבא למערכת המשפחתית!',
        });
        onClose();
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

    if (!otpMainUserEmail.trim()) {
      setError('יש למלא את כתובת האימייל של המשתמש הראשי');
      setLoading(false);
      return;
    }

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
        // TODO: Verify family member connection to main user
        toast({
          title: 'התחברות הצליחה',
          description: 'ברוך הבא למערכת המשפחתית!',
        });
        onClose();
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

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setMainUserEmail('');
    setOtpEmail('');
    setOtpMainUserEmail('');
    setOtpCode('');
    setOtpSentAt(null);
    setShowOtpInput(false);
    setError('');
    setActiveTab('signin');
    setShowSignup(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignupComplete = () => {
    setShowSignup(false);
    toast({
      title: 'הרשמה הושלמה',
      description: 'כעת תוכל להתחבר עם הפרטים שהזנת',
    });
  };

  const handleBackToAuth = () => {
    setShowSignup(false);
  };

  // Show signup component if requested
  if (showSignup) {
    return (
      <FamilyMemberSignup 
        onComplete={handleSignupComplete}
        onBack={handleBackToAuth}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rtl-text">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            התחברות כבן משפחה
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">סיסמה</TabsTrigger>
            <TabsTrigger value="otp">קוד OTP</TabsTrigger>
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
                  הכנס את פרטי ההתחברות שלך וכתובת האימייל של המשתמש הראשי
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-right block">האימייל שלך *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="האימייל שלך"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-right block">סיסמה *</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="main-user-email" className="text-right block">אימייל המשתמש הראשי *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="main-user-email"
                        type="email"
                        value={mainUserEmail}
                        onChange={(e) => setMainUserEmail(e.target.value)}
                        placeholder="האימייל של המשתמש הראשי אליו אתה מחובר"
                        className="pl-10 text-right"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      זהו האימייל של המשתמש הראשי שאישר את הבקשה שלך להצטרפות
                    </p>
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
                    ? 'הכנס את כתובת האימייל שלך ושל המשתמש הראשי לקבלת קוד'
                    : 'הכנס את הקוד שנשלח לאימייל שלך'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showOtpInput ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email" className="text-right block">האימייל שלך *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="האימייל שלך"
                          className="pl-10 text-right"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp-main-user-email" className="text-right block">אימייל המשתמש הראשי *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp-main-user-email"
                          type="email"
                          value={otpMainUserEmail}
                          onChange={(e) => setOtpMainUserEmail(e.target.value)}
                          placeholder="האימייל של המשתמש הראשי אליו אתה מחובר"
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
        </Tabs>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            עדיין אין לך חשבון?
          </p>
          <Button 
            variant="outline" 
            onClick={() => setShowSignup(true)}
            className="w-full"
          >
            הרשמה כבן משפחה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};