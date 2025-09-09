import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'שגיאה בהתחברות',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (!data.user) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לאמת את המשתמש',
          variant: 'destructive',
        });
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleError || !roleData || (roleData.role as string) !== 'admin') {
        // Sign out if not admin
        await supabase.auth.signOut();
        toast({
          title: 'אין הרשאה',
          description: 'משתמש זה אינו מורשה לגשת למערכת הניהול',
          variant: 'destructive',
        });
        return;
      }

      // Success - redirect to admin dashboard
      toast({
        title: 'התחברות מוצלחת',
        description: 'ברוך הבא למערכת הניהול',
      });
      
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהתחברות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">מערכת ניהול</CardTitle>
          <CardDescription>
            כניסה למנהלי המערכת בלבד
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס את הסיסמה"
                required
                dir="ltr"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/admin-setup')}
              className="text-sm text-muted-foreground"
            >
              הגדרת מנהל ראשון
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}