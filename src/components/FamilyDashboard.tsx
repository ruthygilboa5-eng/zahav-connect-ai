import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  AlertTriangle, 
  Bell, 
  Camera, 
  MessageSquare, 
  Settings, 
  Plus,
  Clock,
  CheckCircle,
  User,
  Upload,
  Calendar,
  Gamepad2,
  Shield,
  Home,
  Users,
  X
} from 'lucide-react';
import { useAuthDisplayName, useMainUserDisplayName } from '@/hooks/useDisplayName';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { useOwnerContext } from '@/providers/OwnerProvider';
import { FAMILY_ACTIONS } from '@/types/family';
import ContentUploadModal from '@/components/ContentUploadModal';
import ActionCard from '@/components/ActionCard';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';

type ContentType = 'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE';

interface Activity {
  id: string;
  type: 'wakeup' | 'emergency' | 'reminder' | 'memory' | 'game' | 'message';
  message: string;
  timestamp: string;
  status: 'active' | 'completed' | 'missed';
}

const FamilyDashboard = () => {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'wakeup',
      message: 'המשתמש דיווח שהוא בסדר',
      timestamp: '08:30',
      status: 'completed'
    },
    {
      id: '2',
      type: 'reminder',
      message: 'תזכורת לתרופת לחץ דם - לא נלקחה',
      timestamp: '12:00',
      status: 'missed'
    },
    {
      id: '3',
      type: 'memory',
      message: 'צפה בתמונות מחתונת הנכדה',
      timestamp: '15:45',
      status: 'completed'
    }
  ]);
  const familyName = useAuthDisplayName();
  const mainUserName = useMainUserDisplayName();
  const { toast } = useToast();
  const { familyMembers } = useFamilyProvider();
  // TODO: Replace with actual pending queue management
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ContentType>('MEDIA');
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const { ownerUserId, isApproved, loading: ownerLoading } = useOwnerContext();
  const { authState } = useAuth();

  const handleContentSubmit = (type: ContentType) => {
    setUploadType(type);
    setUploadModalOpen(true);
  };

  const handleChatOpen = () => {
    // Navigate to family chat or open chat modal
    toast({
      title: 'צ\'אט משפחה',
      description: 'פיצ\'ר זה יפותח בקרוב'
    });
  };

  const getActivityIcon = (type: Activity['type']) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'wakeup': return <Heart className={iconClass} />;
      case 'emergency': return <AlertTriangle className={iconClass} />;
      case 'reminder': return <Bell className={iconClass} />;
      case 'memory': return <Camera className={iconClass} />;
      case 'message': return <MessageSquare className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return 'bg-zahav-green text-white';
      case 'missed': return 'bg-zahav-red text-white';
      case 'active': return 'bg-zahav-blue text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'missed': return 'הוחמץ';
      case 'active': return 'פעיל';
      default: return 'לא ידוע';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />מאושר</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />ממתין</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />מבוטל</Badge>;
      default:
        return null;
    }
  };

  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Camera': return Camera;
      case 'Upload': return Upload;
      case 'Bell': return Bell;
      case 'Gamepad2': return Gamepad2;
      case 'MessageSquare': return MessageSquare;
      default: return Camera;
    }
  };

  const getActionHandler = (key: string) => {
    switch (key) {
      case 'POST_MEDIA': return () => handleContentSubmit('MEDIA');
      case 'POST_STORY': return () => handleContentSubmit('STORY');
      case 'SUGGEST_REMINDER': return () => handleContentSubmit('REMINDER');
      case 'INVITE_GAME': return () => handleContentSubmit('GAME_INVITE');
      case 'CHAT': return handleChatOpen;
      default: return () => {};
    }
  };

  const getActionDescription = (key: string) => {
    switch (key) {
      case 'POST_MEDIA': return 'שתף תמונות ורגעים יפים';
      case 'POST_STORY': return 'ספר על רגע מיוחד או זיכרון';
      case 'SUGGEST_REMINDER': return 'הצע תזכורת לתרופות או פגישות';
      case 'INVITE_GAME': return 'הזמן למשחק משותף וכיף';
      case 'CHAT': return 'התכתב עם המשפחה';
      default: return '';
    }
  };

  const getPrimaryLabel = (key: string) => {
    switch (key) {
      case 'POST_MEDIA': return 'העלה מדיה';
      case 'POST_STORY': return 'שתף סיפור';
      case 'SUGGEST_REMINDER': return 'הצע תזכורת';
      case 'INVITE_GAME': return 'הזמן משחק';
      case 'CHAT': return 'פתח צ\'אט';
      default: return '';
    }
  };

  // Show pending state if family member is not approved yet
  if (ownerLoading) {
    return (
      <div className="family-dashboard p-6 rtl-text">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-semibold text-foreground mb-2">טוען...</h2>
              <p className="text-muted-foreground">בודק סטטוס החיבור למערכת</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isApproved || !ownerUserId) {
    return (
      <div className="family-dashboard p-6 rtl-text">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  שלום {familyName}
                </h1>
              </div>
            </div>
          </div>

          {/* Pending Approval State */}
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  ממתין לאישור
                </h2>
                <p className="text-muted-foreground mb-6">
                  הבקשה נשלחה לבעל החשבון הראשי. לאחר אישור תופיע כאן הפעילות.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    בעל החשבון הראשי יקבל הודעה על הבקשה ויוכל לאשר אותה ממסך ההגדרות
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  חזרה לעמוד הראשי
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rtl-text">
      <div className="max-w-6xl mx-auto">
        {/* Demo Notice */}
        <div className="mb-6">
          <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    זהו דף דמו – הנתונים כאן אינם אמיתיים
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    דף זה משמש להדגמת המערכת בלבד
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">עמוד ראשי</span>
            </Button>
            <User className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                שלום {familyName}
              </h1>
              <p className="text-muted-foreground">
                מחובר/ת לחשבון של {mainUserName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsProfileSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              פרופיל
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6">
          <Card className="border-l-4 border-l-primary bg-muted/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    הפיצ'רים שלך נקבעים על ידי בעל החשבון הראשי
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    חלק מהפעולות עשויות להיות מושבתות בהתאם להרשאות שלך
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                פעילות היום
              </CardTitle>
              <CardDescription>
                סיכום פעילויות ותזכורות של היום
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {getStatusText(activity.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Always Show All 5 Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                פעולות משפחה
              </CardTitle>
              <CardDescription>
                כל הפעולות הזמינות במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {FAMILY_ACTIONS.map((action) => {
                  const IconComponent = getActionIcon(action.icon);
                  return (
                    <ActionCard
                      key={action.key}
                      scope={action.scope}
                      title={action.title}
                      description={getActionDescription(action.key)}
                      icon={IconComponent}
                      onAction={getActionHandler(action.key)}
                      primaryLabel={getPrimaryLabel(action.key)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Memories */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                זכרונות אחרונים
              </CardTitle>
              <CardDescription>
                תמונות וסיפורים שנוספו לאחרונה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-zahav-green" />
                מצב המערכת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">קשר אחרון</span>
                  <Badge className="bg-zahav-green text-white">08:30</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">סטטוס התקן</span>
                  <Badge className="bg-zahav-green text-white">מחובר</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">תזכורות היום</span>
                  <Badge variant="outline">3/5</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Modals */}
        <ContentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          contentType={uploadType}
        />
        
        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          onClose={() => setIsProfileSettingsOpen(false)}
        />
      </div>
    </div>
  );
};

export default FamilyDashboard;