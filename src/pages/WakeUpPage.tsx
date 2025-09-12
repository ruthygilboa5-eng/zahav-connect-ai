import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, ArrowRight, Home, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoHome } from '@/hooks/useGoHome';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import { useWakeUpNotification } from '@/hooks/useWakeUpNotification';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface WakeUpPageProps {
  userName?: string;
}

const WakeUpPage = ({ userName }: WakeUpPageProps) => {
  const [isWakeUpSent, setIsWakeUpSent] = useState(false);
  const navigate = useNavigate();
  const goHome = useGoHome();
  const { profile } = useProfile();
  const { authState } = useAuth();
  const { sendWakeUpNotification, loading } = useWakeUpNotification();
  const { familyMembers, missingTables } = useFamilyMembers();

  const handleWakeUp = async () => {
    const success = await sendWakeUpNotification();
    if (success) {
      setIsWakeUpSent(true);
    }
  };

  // Get display message for success state
  const getSuccessMessage = () => {
    const name = userName || profile?.first_name || 'המשתמש';
    return `הודעת התעוררת נשלחה בהצלחה ✔️`;
  };

  // Show family management message if no family members
  if (!missingTables && familyMembers.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen rtl-text">
        <div className="text-center mb-8 max-w-md">
          <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            אין בני משפחה
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            כדי להשתמש בפיצ'ר "התעוררתי", עליך להוסיף בני משפחה תחילה
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/family-management')}
              className="w-full bg-primary text-primary-foreground"
            >
              <Users className="w-5 h-5 ml-2" />
              נהל בני משפחה
            </Button>
            
            <Button
              onClick={goHome}
              variant="outline"
              className="w-full"
            >
              <Home className="w-5 h-5 ml-2" />
              חזרה לעמוד הראשי
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen rtl-text">
      <div className="text-center mb-8 max-w-md">
        <Heart className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground mb-4">
          בוקר טוב {userName}!
        </h1>
        
        {!isWakeUpSent ? (
          <>
            <p className="text-xl text-muted-foreground mb-8">
              לחץ כדי לדווח שהתעוררת והכל בסדר
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              ההודעה תישלח ל-{familyMembers.length} בני משפחה
            </p>
            <Button
              onClick={handleWakeUp}
              disabled={loading}
              className="zahav-button zahav-button-green w-32 h-32 text-xl font-bold"
            >
              <Heart className="w-8 h-8 mb-2" />
              {loading ? 'שולח...' : 'התעוררתי!'}
            </Button>
          </>
        ) : (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="text-center">
              <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                מצוין! 
              </h2>
              <p className="text-green-700 text-lg">
                {getSuccessMessage()}
              </p>
            </div>
          </Card>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={goHome}
            variant="outline"
            className="w-full"
          >
            <Home className="w-5 h-5 ml-2" />
            חזרה לעמוד הראשי
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WakeUpPage;