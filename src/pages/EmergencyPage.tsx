import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmergencyPageProps {
  userName?: string;
}

const EmergencyPage = ({ userName = "אבא" }: EmergencyPageProps) => {
  const [isEmergencySent, setIsEmergencySent] = useState(false);
  const navigate = useNavigate();

  const handleEmergency = () => {
    setIsEmergencySent(true);
    // Here we would send emergency notification with GPS
    console.log('Emergency notification sent with GPS location');
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center rtl-text">
      <div className="text-center mb-8 max-w-md">
        {!isEmergencySent ? (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              לחצן חירום
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              לחצן זה ישלח התראה מיידית למשפחה עם המיקום שלך
            </p>
            
            <Button
              onClick={handleEmergency}
              className="zahav-button zahav-button-red w-32 h-32 text-xl font-bold mb-6"
            >
              <AlertTriangle className="w-8 h-8 mb-2" />
              חירום!
            </Button>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ לחיצה על הכפתור תשלח הודעת חירום מיידית לבני המשפחה שהוגדרו עם המיקום שלך
              </p>
            </div>
          </>
        ) : (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                הכל יהיה בסדר {userName}
              </h2>
              <p className="text-blue-700 text-lg mb-2">
                הודעת חירום נשלחה לבני המשפחה שהוגדרו:
              </p>
              <div className="space-y-2 mb-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <p className="text-blue-800 font-medium">📱 רותי (בת)</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <p className="text-blue-800 font-medium">📱 דני (בן)</p>
                </div>
              </div>
              <p className="text-blue-600 text-sm">
                כולל המיקום שלך כדי שיוכלו לעזור לך מהר 📍
              </p>
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ ההודעות נשלחו בהצלחה
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-8">
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
  );
};

export default EmergencyPage;