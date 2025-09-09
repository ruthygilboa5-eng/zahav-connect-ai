import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle } from 'lucide-react';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdminExists, setIsCheckingAdminExists] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkIfAdminExists();
  }, []);

  useEffect(() => {
    if (!isCheckingAdminExists && adminExists) {
      navigate('/admin-login');
    }
  }, [adminExists, isCheckingAdminExists, navigate]);

  const checkIfAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) {
        console.error('Error checking admin existence:', error);
        return;
      }

      setAdminExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking admin existence:', error);
    } finally {
      setIsCheckingAdminExists(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמאות אינן תואמות',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמה חייבת להכיל לפחות 6 תווים',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Register the admin user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-login`,
          data: {
            first_name: 'מנהל מערכת',
            last_name: '',
            is_admin: 'true', // Mark as admin for proper role assignment
          }
        }
      });

      if (error) {
        toast({
          title: 'שגיאה בהרשמה',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        // The admin role should already be assigned via the migration
        toast({
          title: 'הרשמה מוצלחת!',
          description: 'חשבון המנהל נוצר בהצלחה. תוכל עכשיו להתחבר.',
        });
        
        // Wait a moment for the user to read the message, then redirect
        setTimeout(() => {
          navigate('/admin-login');
        }, 2000);
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהגדרת החשבון',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAdminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">בודק הגדרות המערכת...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">מערכת הניהול מוכנה</CardTitle>
            <CardDescription>
              כבר קיים מנהל במערכת. תוכל להתחבר דרך דף ההתחברות.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/admin-login')}
              className="w-full"
            >
              עבור לדף התחברות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">הגדרת מנהל ראשי</CardTitle>
          <CardDescription>
            יצירת חשבון המנהל הראשון של המערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הכנס את כתובת האימייל"
                required
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground">
                השתמש באימייל: ruthygilboa5@gmail.com
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה (לפחות 6 תווים)"
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אישור סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הכנס שוב את הסיסמה"
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'יוצר חשבון...' : 'צור חשבון מנהל'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/admin-login')}
              className="text-sm text-muted-foreground"
            >
              כבר יש לך חשבון? התחבר כאן
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}