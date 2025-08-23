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
  Lock,
  Shield
} from 'lucide-react';
import { useAuthDisplayName, useMainUserDisplayName } from '@/hooks/useDisplayName';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { usePermissionRequests } from '@/hooks/usePermissionRequests';
import { FAMILY_SCOPES, scopeLabels } from '@/types/family';
import ContentUploadModal from '@/components/ContentUploadModal';

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
  const { canPostMedia, canSuggestReminder, canInviteGame, canChat } = useFamilyPermissions();
  const { addToPendingQueue } = useFamilyProvider();
  const { requestPermission, getRequestStatus } = usePermissionRequests();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ContentType>('MEDIA');

  const handleContentSubmit = (type: ContentType) => {
    if (type === 'MEDIA' || type === 'STORY') {
      if (!canPostMedia) {
        toast({
          title: 'אין הרשאה',
          description: 'אין לך הרשאה להעלאת תוכן. פנה למשתמש הראשי.',
          variant: 'destructive'
        });
        return;
      }
    } else if (type === 'REMINDER') {
      if (!canSuggestReminder) {
        toast({
          title: 'אין הרשאה',
          description: 'אין לך הרשאה להצעת תזכורות. פנה למשתמש הראשי.',
          variant: 'destructive'
        });
        return;
      }
    } else if (type === 'GAME_INVITE') {
      if (!canInviteGame) {
        toast({
          title: 'אין הרשאה',
          description: 'אין לך הרשאה להזמנת משחקים. פנה למשתמש הראשי.',
          variant: 'destructive'
        });
        return;
      }
    }
    
    setUploadType(type);
    setUploadModalOpen(true);
  };

  const handleChatOpen = () => {
    if (!canChat) {
      toast({
        title: 'אין הרשאה',
        description: 'אין לך הרשאה לצ\'אט המשפחה. פנה למשתמש הראשי.',
        variant: 'destructive'
      });
      return;
    }
    // Navigate to family chat or open chat modal
    toast({
      title: 'צ\'אט משפחה',
      description: 'פיצ\'ר זה יפותח בקרוב'
    });
  };

  const handleRequestPermission = async (scope: keyof typeof FAMILY_SCOPES) => {
    try {
      await requestPermission(FAMILY_SCOPES[scope]);
      toast({
        title: 'בקשתך נשלחה',
        description: 'בקשתך להרשאה נשלחה למשתמש הראשי לאישור'
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשליחת הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getStatusDisplay = (scope: keyof typeof FAMILY_SCOPES) => {
    const status = getRequestStatus(FAMILY_SCOPES[scope]);
    switch (status) {
      case 'APPROVED':
        return { text: 'מאושר ✅', color: 'bg-zahav-green text-white' };
      case 'PENDING':
        return { text: 'ממתין לאישור ⏳', color: 'bg-zahav-yellow text-foreground' };
      case 'DECLINED':
        return { text: 'לא מורשה ❌', color: 'bg-zahav-red text-white' };
      default:
        return { text: 'לא ביקשת', color: 'bg-muted text-muted-foreground' };
    }
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

  const actionCards = [
    {
      id: 'media',
      title: 'העלאת תמונות',
      description: 'שתף תמונות ורגעים יפים',
      icon: Camera,
      color: 'zahav-blue',
      enabled: canPostMedia,
      scope: 'POST_MEDIA' as const,
      action: () => handleContentSubmit('MEDIA')
    },
    {
      id: 'story',
      title: 'שיתוף סיפור',
      description: 'ספר על רגע מיוחד או זיכרון',
      icon: Upload,
      color: 'zahav-yellow',
      enabled: canPostMedia,
      scope: 'POST_MEDIA' as const,
      action: () => handleContentSubmit('STORY')
    },
    {
      id: 'reminder',
      title: 'הצעת תזכורת',
      description: 'הצע תזכורת לתרופות או פגישות',
      icon: Bell,
      color: 'zahav-orange',
      enabled: canSuggestReminder,
      scope: 'SUGGEST_REMINDER' as const,
      action: () => handleContentSubmit('REMINDER')
    },
    {
      id: 'game',
      title: 'הזמנת משחק',
      description: 'הזמן למשחק משותף וכיף',
      icon: Gamepad2,
      color: 'zahav-green',
      enabled: canInviteGame,
      scope: 'INVITE_GAME' as const,
      action: () => handleContentSubmit('GAME_INVITE')
    },
    {
      id: 'chat',
      title: 'צ\'אט משפחה',
      description: 'התכתב עם המשפחה',
      icon: MessageSquare,
      color: 'zahav-purple',
      enabled: canChat,
      scope: 'CHAT' as const,
      action: handleChatOpen
    }
  ];

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
              <p className="text-muted-foreground">
                מחובר/ת לחשבון של {mainUserName}
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                פעולות זמינות
              </CardTitle>
              <CardDescription>
                פעולות שאת/ה מורשה לבצע
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionCards.map((action) => {
                  const status = getStatusDisplay(action.scope);
                  return (
                    <div key={action.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <action.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{action.title}</span>
                        </div>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {action.enabled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={action.action}
                          >
                            {action.title}
                          </Button>
                        ) : (
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full opacity-50 cursor-not-allowed"
                              disabled
                            >
                              <Lock className="w-4 h-4 ml-2" />
                              {action.title}
                            </Button>
                            
                            {(getRequestStatus(action.scope) === 'NONE' || 
                              getRequestStatus(action.scope) === 'DECLINED') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handleRequestPermission(action.scope)}
                              >
                                בקש הרשאה
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
        
        {/* Content Upload Modal */}
        <ContentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          contentType={uploadType}
        />
      </div>
    </div>
  );
};

export default FamilyDashboard;