import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, UserPlus, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMainUser, setIsMainUser] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !firstName || !lastName) {
      setError('נא למלא את כל השדות');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            is_main_user: isMainUser
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('כתובת האימייל כבר רשומה במערכת');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: "ההרשמה הושלמה",
          description: "נשלח אימייל אישור. נא לבדוק את תיבת הדואר שלך.",
        });
      } else if (data.session) {
        // Auto-confirm is enabled, create profile and role
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName
          });

        if (!profileError) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: isMainUser ? 'main_user' : 'family_basic'
            });

          if (!roleError) {
            toast({
              title: "ברוך הבא!",
              description: "החשבון נוצר בהצלחה",
            });
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('אירעה שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('נא למלא את כל השדות');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('כתובת אימייל או סיסמה שגויים');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('נא לאשר את כתובת האימייל שלך לפני הכניסה');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.session) {
        toast({
          title: "התחברת בהצלחה",
          description: "ברוך השב!",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('אירעה שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 rtl-text">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">זהב</h1>
          </div>
          <p className="text-muted-foreground">מערכת טיפול ומעקב לקשישים</p>
        </div>

        <Card>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                כניסה
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                הרשמה
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>כניסה למערכת</CardTitle>
                <CardDescription>
                  הכנס את פרטי החשבון שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">כתובת אימייל</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={loading}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">סיסמה</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="סיסמה"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    כניסה
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>יצירת חשבון חדש</CardTitle>
                <CardDescription>
                  מלא את הפרטים ליצירת חשבון
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">שם פרטי</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="שם פרטי"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">שם משפחה</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="שם משפחה"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">כתובת אימייל</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={loading}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="סיסמה (לפחות 6 תווים)"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">אישור סיסמה</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="הכנס את הסיסמה שוב"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>סוג החשבון</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isMainUser}
                          onChange={() => setIsMainUser(true)}
                          className="rounded"
                        />
                        <span className="text-sm">משתמש ראשי (קשיש)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isMainUser}
                          onChange={() => setIsMainUser(false)}
                          className="rounded"
                        />
                        <span className="text-sm">בן משפחה</span>
                      </label>
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    יצירת חשבון
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;