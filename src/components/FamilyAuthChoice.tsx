import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, LogIn, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/FixedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FamilyAuthChoiceProps {
  onBack: () => void;
}

const FamilyAuthChoice: React.FC<FamilyAuthChoiceProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'choice' | 'login' | 'register'>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { authState } = useAuth();

  // Remove automatic redirection - let users access family-auth page even if authenticated

  useEffect(() => {
    if (mode === 'register') {
      navigate('/register-family-member');
    }
  }, [mode, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Check if user is approved family member
        const { data: familyLink } = await supabase
          .from('family_links')
          .select('status')
          .eq('member_user_id', data.user.id)
          .eq('status', 'APPROVED')
          .maybeSingle();

        if (familyLink) {
          // Successful family member login - redirect to family dashboard
          navigate('/family', { replace: true });
        } else {
          setError('החשבון שלך עדיין ממתין לאישור מהמשתמש הראשי');
        }
      }
    } catch (err) {
      setError('אירעה שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)'
      }}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              בן משפחה
            </h1>
            <p className="text-gray-600">
              בחר את האפשרות המתאימה
            </p>
          </div>

          <div className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('register')}>
              <CardHeader>
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">הרשמה חדשה</CardTitle>
                    <CardDescription>
                      אני בן משפחה חדש ורוצה להירשם
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('login')}>
              <CardHeader>
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <LogIn className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">התחברות</CardTitle>
                    <CardDescription>
                      יש לי כבר חשבון ברצוני להתחבר
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזור לדף הראשי
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)'
      }}>
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setMode('choice')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">התחברות בן משפחה</CardTitle>
                  <CardDescription>
                    הזן את פרטי ההתחברות שלך
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="password">סיסמה</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'מתחבר...' : 'התחבר'}
                </Button>
                
                <div className="text-center">
                  <Button variant="link" className="text-sm text-muted-foreground">
                    שכחתי סיסמה
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return null;
};

export default FamilyAuthChoice;