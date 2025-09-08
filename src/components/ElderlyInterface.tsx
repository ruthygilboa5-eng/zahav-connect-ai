import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageSquare, 
  Calendar, 
  Gamepad2, 
  AlertTriangle, 
  Home, 
  Users,
  Sunrise,
  Clock,
  Phone,
  Bell,
  Camera,
  User,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '@/providers/FixedAuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useDataProvider } from '@/providers/DataProvider';
import { useAuthDisplayName } from '@/hooks/useDisplayName';
import { PendingApprovals } from '@/components/PendingApprovals';
import PermissionRequestsSection from '@/components/PermissionRequestsSection';
import NotificationBadge from '@/components/NotificationBadge';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';

interface ElderlyInterfaceProps {
  userName?: string;
}

const ElderlyInterface = ({ userName }: ElderlyInterfaceProps) => {
  const [lastAction, setLastAction] = useState<string>("");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { userProfile } = useDataProvider();
  const displayName = useAuthDisplayName();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleButtonClick = (action: string, buttonName: string) => {
    setLastAction(`${buttonName} נלחץ`);
    console.log(`Action: ${action}`);
    
    // Navigate to specific pages
    switch (action) {
      case 'wakeup':
        navigate('/wakeup');
        break;
      case 'emergency':
        navigate('/emergency');
        break;
      case 'emergency-contacts':
        navigate('/emergency-contacts');
        break;
      case 'reminders':
        navigate('/reminders');
        break;
      case 'memories':
        navigate('/memories');
        break;
      case 'games':
        navigate('/games');
        break;
      case 'family-board':
        navigate('/family-board');
        break;
      default:
        console.log(`No navigation defined for action: ${action}`);
    }
  };

  const buttons = [
    {
      id: 'wakeup',
      name: 'התעוררתי',
      description: 'אני בסדר',
      icon: Heart,
      className: 'zahav-button zahav-button-green',
      action: 'wakeup',
      position: 'center'
    },
    {
      id: 'emergency',
      name: 'חירום',
      description: 'עזרה מיידית',
      icon: AlertTriangle,
      className: 'zahav-button zahav-button-red',
      action: 'emergency',
      position: 'petal'
    },
    {
      id: 'contacts',
      name: 'מוקדים',
      description: 'משטרה ומד״א',
      icon: Phone,
      className: 'zahav-button zahav-button-purple',
      action: 'emergency-contacts',
      position: 'petal'
    },
    {
      id: 'reminders',
      name: 'תזכורות',
      description: 'תרופות ופגישות',
      icon: Bell,
      className: 'zahav-button zahav-button-blue',
      action: 'reminders',
      position: 'petal'
    },
    {
      id: 'memories',
      name: 'זכרונות',
      description: 'תמונות וסיפורים',
      icon: Camera,
      className: 'zahav-button zahav-button-yellow',
      action: 'memories',
      position: 'petal'
    },
    {
      id: 'games',
      name: 'משחקים',
      description: 'עם הנכדים',
      icon: Gamepad2,
      className: 'zahav-button zahav-button-pink',
      action: 'games',
      position: 'petal'
    },
    {
      id: 'family',
      name: 'המשפחה',
      description: 'הודעות ועדכונים',
      icon: MessageSquare,
      className: 'zahav-button zahav-button-orange',
      action: 'family-board',
      position: 'petal'
    }
  ];

  const centerButton = buttons.find(b => b.position === 'center');
  const petalButtons = buttons.filter(b => b.position === 'petal');

  return (
    <div className="p-4 flex flex-col items-center justify-center rtl-text">
      {/* Profile & Logout Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setIsProfileSettingsOpen(true)}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          פרופיל
        </Button>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            שלום, {displayName}!
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          מה תרצה לעשות היום?
        </p>
      </div>

      {/* Flower Arrangement */}
      <div className="flower-arrangement mb-8">
        {/* Center Button */}
        {centerButton && (
          <div className="flower-center">
            <button
              onClick={() => handleButtonClick(centerButton.action, centerButton.name)}
              className={`${centerButton.className} w-28 h-28 md:w-36 md:h-36`}
              aria-label={centerButton.description}
            >
              <centerButton.icon className="w-8 h-8 md:w-10 md:h-10 mb-1" />
              <span className="text-sm md:text-base font-bold">
                {centerButton.name}
              </span>
            </button>
          </div>
        )}

        {/* Surrounding Buttons */}
        {petalButtons.map((button, index) => (
          <div key={button.id} className="flower-petal">
            <button
              onClick={() => handleButtonClick(button.action, button.name)}
              className={button.className}
              aria-label={button.description}
            >
              <button.icon className="w-6 h-6 md:w-7 md:h-7 mb-1" />
              <span className="text-xs md:text-sm font-bold leading-tight">
                {button.name}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Status/Feedback */}
      {lastAction && (
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-2 border-primary/20">
          <p className="text-lg font-medium text-center text-primary">
            {lastAction}
          </p>
        </Card>
      )}

      {/* Management Buttons */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/family-requests')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Users className="w-5 h-5" />
          בקשות הצטרפות משפחה
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/review')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground relative"
        >
          <Clock className="w-5 h-5" />
          אישור תוכן משפחתי
          <NotificationBadge />
        </Button>
      </div>

      {/* Family Permissions Section */}
      <div className="mt-8 w-full max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Shield className="w-6 h-6 text-primary" />
              ניהול הרשאות בני המשפחה
            </CardTitle>
            <CardDescription>
              בקשות הרשאות ממתינות לאישור מבני המשפחה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionRequestsSection />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center max-w-md">
        <p className="text-muted-foreground text-lg">
          לחץ על הכפתור הירוק כדי לדווח שאתה בסדר
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          כפתור אדום לחירום בלבד
        </p>
      </div>
      
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
    </div>
  );
};

export default ElderlyInterface;