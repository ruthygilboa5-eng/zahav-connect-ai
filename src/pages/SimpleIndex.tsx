import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart } from 'lucide-react';
import { useAuth } from '@/providers/FixedAuthProvider';
import { useNavigate } from 'react-router-dom';

const SimpleIndex = () => {
  const { authState, loginAsMainUser, loginAsFamily } = useAuth();
  const navigate = useNavigate();

  console.log('SimpleIndex rendering, authState:', authState);

  // If already authenticated, redirect
  if (authState.isAuthenticated) {
    const targetPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    navigate(targetPath);
    return null;
  }

  const handleMainUserLogin = () => {
    console.log('Logging in as main user');
    loginAsMainUser('משתמש ראשי');
  };

  const handleFamilyLogin = () => {
    console.log('Logging in as family member');
    loginAsFamily('בן משפחה');
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
          <p className="text-xl text-gray-600">
            בחר את סוג המשתמש שלך
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main User Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleMainUserLogin}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-800">משתמש ראשי</CardTitle>
              <CardDescription className="text-lg">
                הורה או בני זוג הזקוקים לתמיכה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleMainUserLogin}>
                היכנס כמשתמש ראשי
              </Button>
            </CardContent>
          </Card>

          {/* Family Member Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleFamilyLogin}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">בן משפחה</CardTitle>
              <CardDescription className="text-lg">
                ילדים או קרובי משפחה המעוניינים לעזור
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleFamilyLogin}>
                היכנס כבן משפחה
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleIndex;