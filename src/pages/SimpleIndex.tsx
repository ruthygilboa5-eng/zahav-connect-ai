import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart, LogIn, Play, UserPlus, Lock } from 'lucide-react';
import { useAuth } from '@/providers/FixedAuthProvider';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';

const SimpleIndex = () => {
  const { authState, loginAsMainUser, loginAsFamily } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'MAIN_USER' | 'FAMILY'>('MAIN_USER');

  console.log('SimpleIndex rendering, authState:', authState);

  // If already authenticated, redirect
  if (authState.isAuthenticated) {
    const targetPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    return <Navigate to={targetPath} replace />;
  }

  const handleMainUserDemo = () => {
    console.log('Demo login as main user');
    loginAsMainUser('משתמש ראשי');
  };

  const handleFamilyDemo = () => {
    console.log('Demo login as family member');
    loginAsFamily('בן משפחה');
  };

  const handleMainUserAuth = () => {
    setAuthModalRole('MAIN_USER');
    setShowAuthModal(true);
  };

  const handleFamilyAuth = () => {
    navigate('/family-auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: 'radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)'
    }}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            מערכת זהב
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            בחר את סוג המשתמש שלך
          </p>
          <p className="text-sm text-gray-500">
            ניתן לנסות דמו או להתחבר עם חשבון אישי
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Main User Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-800">משתמש ראשי</CardTitle>
              <CardDescription className="text-lg mb-4">
                הורה או בני זוג הזקוקים לתמיכה
              </CardDescription>
              <CardDescription className="text-sm text-muted-foreground">
                ניהול מלא של המערכת, הגדרות ואישור תכנים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleMainUserDemo}
              >
                <Play className="w-4 h-4 ml-2" />
                דמו כמשתמש ראשי
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50" 
                onClick={handleMainUserAuth}
              >
                <LogIn className="w-4 h-4 ml-2" />
                התחבר / הירשם
              </Button>
            </CardContent>
          </Card>

          {/* Family Member Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">בן משפחה</CardTitle>
              <CardDescription className="text-lg mb-4">
                ילדים או קרובי משפחה המעוניינים לעזור
              </CardDescription>
              <CardDescription className="text-sm text-muted-foreground">
                מחובר לחשבון של המשתמש הראשי לעזרה ותמיכה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={handleFamilyDemo}
                aria-label="דמו לצורכי הדגמה בלבד"
              >
                <Play className="w-4 h-4 ml-2" />
                דמו (להדגמה בלבד)
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => navigate('/register-family-member')}
                aria-label="רישום בן משפחה חדש"
              >
                <UserPlus className="w-4 h-4 ml-2" />
                אין לי חשבון – הרשמה
              </Button>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={handleFamilyAuth}
                aria-label="כניסה לבן משפחה קיים"
              >
                <Lock className="w-4 h-4 ml-2" />
                יש לי חשבון – התחברות
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultRole={authModalRole}
      />
    </div>
  );
};

export default SimpleIndex;