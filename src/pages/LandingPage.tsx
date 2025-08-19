import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, Shield, Clock, LogIn } from 'lucide-react';

const LandingPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate page
  useEffect(() => {
    if (authState.isAuthenticated) {
      const targetRoute = authState.role === 'MAIN_USER' ? '/home' : '/family';
      navigate(targetRoute);
    }
  }, [authState.isAuthenticated, authState.role, navigate]);

  const handleAuthRedirect = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/e4b1e680-f7d4-4a90-871c-2b4ff3419c16.png" 
              alt="זוג משתמשים ראשיים מחייכים יחד" 
              className="w-64 h-48 object-cover rounded-2xl mx-auto shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            ZAHAV
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            משפחתי
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            פלטפורמה דיגיטלית המחברת בין משתמשים ראשיים לבני המשפחה שלהם, 
            מאפשרת מעקב בטיחותי ותקשורת קלה ונגישה.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
          <div className="p-6 bg-card rounded-lg border">
            <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">חיבור משפחתי</h3>
            <p className="text-sm text-muted-foreground">תקשורת קלה עם בני המשפחה</p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">בטיחות</h3>
            <p className="text-sm text-muted-foreground">מעקב ואזעקות חרום</p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">תזכורות</h3>
            <p className="text-sm text-muted-foreground">ניהול תרופות ופגישות</p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">קהילה</h3>
            <p className="text-sm text-muted-foreground">משחקים וזכרונות משותפים</p>
          </div>
        </div>

        {/* Auth Button */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">התחל עכשיו</h2>
          <div className="flex justify-center">
            <Button 
              size="lg"
              onClick={handleAuthRedirect}
              className="text-lg px-8 py-6"
            >
              <LogIn className="w-5 h-5 ml-2" />
              התחברות / הרשמה
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            סטטוס: <span className="text-destructive font-medium">מנותק</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;