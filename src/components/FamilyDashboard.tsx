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
  Lock
} from 'lucide-react';
import { useAuthDisplayName, useMainUserDisplayName } from '@/hooks/useDisplayName';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { useFamilyProvider } from '@/providers/FamilyProvider';
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
      action: () => handleContentSubmit('MEDIA')
    },
    {
      id: 'story',
      title: 'שיתוף סיפור',
      description: 'ספר על רגע מיוחד או זיכרון',
      icon: Upload,
      color: 'zahav-yellow',
      enabled: canPostMedia,
      action: () => handleContentSubmit('STORY')
    },
    {
      id: 'reminder',
      title: 'הצעת תזכורת',
      description: 'הצע תזכורת לתרופות או פגישות',
      icon: Bell,
      color: 'zahav-orange',
      enabled: canSuggestReminder,
      action: () => handleContentSubmit('REMINDER')
    },
    {
      id: 'game',
      title: 'הזמנת משחק',
      description: 'הזמן למשחק משותף וכיף',
      icon: Gamepad2,
      color: 'zahav-green',
      enabled: canInviteGame,
      action: () => handleContentSubmit('GAME_INVITE')
    },
    {
      id: 'chat',
      title: 'צ\'אט משפחה',
      description: 'התכתב עם המשפחה',
      icon: MessageSquare,
      color: 'zahav-purple',
      enabled: canChat,
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
              <div className="space-y-3">
                {actionCards.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.enabled ? "outline" : "ghost"}
                    className={`w-full justify-start h-auto p-3 ${
                      action.enabled 
                        ? "hover:bg-muted/80" 
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={action.enabled ? action.action : undefined}
                    disabled={!action.enabled}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {action.enabled ? (
                          <action.icon className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-right flex-1">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.enabled 
                            ? action.description 
                            : 'פיצ\'ר אינו זמין - פנה למשתמש הראשי'
                          }
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
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