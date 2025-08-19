import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, Users, Heart } from 'lucide-react';
import SignupWizard from '@/components/SignupWizard';

const loginSchema = z.object({
  phone: z.string().min(1, "מספר טלפון הוא שדה חובה"),
  password: z.string().min(1, "סיסמה היא שדה חובה")
});

type LoginData = z.infer<typeof loginSchema>;

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: ""
    }
  });

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real authentication
      // For now, simulate login based on phone number patterns
      if (data.phone.includes('050')) {
        login('FAMILY', 'member-1', ['POST_MEDIA', 'SUGGEST_REMINDER', 'PLAY_GAMES']);
        navigate('/family');
      } else {
        login('MAIN_USER');
        navigate('/home');
      }
      toast.success("התחברת בהצלחה!");
    } catch (error) {
      toast.error("שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'MAIN_USER' | 'FAMILY') => {
    if (role === 'FAMILY') {
      login(role, 'member-1', ['POST_MEDIA', 'SUGGEST_REMINDER', 'PLAY_GAMES']);
    } else {
      login(role);
    }
    navigate(role === 'MAIN_USER' ? '/home' : '/family');
    toast.success("התחברות דמו בוצעה בהצלחה!");
  };

  const handleSignupComplete = () => {
    setShowSignup(false);
    toast.success("ההרשמה הושלמה! אנא התחבר עם הפרטים שלך");
  };

  if (showSignup) {
    return <SignupWizard onComplete={handleSignupComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">ZAHAV</h1>
          <p className="text-xl text-muted-foreground">משפחתי</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">התחברות</TabsTrigger>
            <TabsTrigger value="demo">מצב דמו</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  התחברות למערכת
                </CardTitle>
                <CardDescription>
                  הזן את פרטי ההתחברות שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מספר טלפון</FormLabel>
                          <FormControl>
                            <Input placeholder="050-1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סיסמה</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="הזן סיסמה" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "מתחבר..." : "התחבר"}
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">עדיין אין לך חשבון?</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSignup(true)}
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    הרשמה למערכת
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo">
            <Card>
              <CardHeader>
                <CardTitle>מצב דמו</CardTitle>
                <CardDescription>
                  התחבר במצב דמו לבדיקת המערכת
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleDemoLogin('MAIN_USER')}
                  className="w-full"
                  size="lg"
                >
                  <Users className="w-5 h-5 ml-2" />
                  התחברות כמשתמש ראשי
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleDemoLogin('FAMILY')}
                  className="w-full"
                  size="lg"
                >
                  <Heart className="w-5 h-5 ml-2" />
                  התחברות כבן משפחה
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;