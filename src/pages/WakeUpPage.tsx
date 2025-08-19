import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WakeUpPageProps {
  userName?: string;
}

const WakeUpPage = ({ userName = "אבא" }: WakeUpPageProps) => {
  const [isWakeUpSent, setIsWakeUpSent] = useState(false);
  const navigate = useNavigate();

  const handleWakeUp = () => {
    setIsWakeUpSent(true);
    // Here we would send notification to family
    console.log('Wake up notification sent to family');
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Amber Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col items-center justify-center min-h-screen rtl-text">
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
              <Button
                onClick={handleWakeUp}
                className="zahav-button zahav-button-green w-32 h-32 text-xl font-bold"
              >
                <Heart className="w-8 h-8 mb-2" />
                התעוררתי!
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
                  ההודעה נשלחה למשפחה שלך
                </p>
                <p className="text-green-600 text-sm mt-2">
                  כולם יודעים שאתה בסדר 💚
                </p>
              </div>
            </Card>
          )}

          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-5 h-5 ml-2" />
              חזרה לעמוד הראשי
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WakeUpPage;