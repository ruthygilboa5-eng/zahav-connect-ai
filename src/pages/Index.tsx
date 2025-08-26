import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';

const Index = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  // If already authenticated, go to appropriate page
  if (authState.isAuthenticated) {
    const targetPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    navigate(targetPath, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">ZAHAV</h1>
          <p className="text-2xl text-muted-foreground mb-2">משפחתי</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            מערכת ניהול משפחתי חכמה המחברת בין דורות ומשמרת על קשר אמיץ עם בני המשפחה
          </p>
        </div>

        {/* Authentication Info */}
        <div className="text-center mb-8 p-6 bg-card rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-3">עם אימייל אישי</h2>
          <p className="text-muted-foreground mb-4">
            כדי לשמור על המידע שלכם באופן קבוע ולהנות מכל התכונות, תוכלו להירשם עם כתובת מייל אישית
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-green-600" />
            <span>מידע מוגן ובטוח</span>
          </div>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                <Users className="w-8 h-8 text-primary" />
                משתמש ראשי
              </CardTitle>
              <CardDescription className="text-lg">
                הממשק המלא עם שליטה על כל המערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>ניהול מלא של הגדרות המערכת</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>אישור תוכן מבני המשפחה</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>ניהול רשימת בני המשפחה</span>
                </div>
              </div>
              <Button 
                onClick={handleAuthClick}
                className="w-full"
                size="lg"
              >
                התחברות / הרשמה
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                <Heart className="w-8 h-8 text-pink-600" />
                בן משפחה
              </CardTitle>
              <CardDescription className="text-lg">
                דשבורד משפחתי להשתתפות פעילה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span>העלאת תמונות וסיפורים</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-600" />
                  <span>הצעת תזכורות</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-600" />
                  <span>הזמנת משחקים משותפים</span>
                </div>
              </div>
              <Button 
                onClick={handleAuthClick}
                variant="outline"
                className="w-full"
                size="lg"
              >
                התחברות / הרשמה
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">מה המערכת מציעה?</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="p-4 bg-card rounded-lg">
              <strong className="text-foreground">ניהול תוכן חכם</strong>
              <br />
              כל תוכן עובר אישור לפני הצגה
            </div>
            <div className="p-4 bg-card rounded-lg">
              <strong className="text-foreground">קשר משפחתי</strong>
              <br />
              חיבור בין הדורות באופן בטוח ונוח
            </div>
            <div className="p-4 bg-card rounded-lg">
              <strong className="text-foreground">ממשק ידידותי</strong>
              <br />
              עיצוב פשוט ונגיש לכל הגילאים
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
