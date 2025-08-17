import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  User
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

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
      message: 'אבא דיווח שהוא בסדר',
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
  const { profile } = useProfile();

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

  const quickActions = [
    {
      name: 'הוסף תזכורת',
      description: 'תרופות או פגישות',
      icon: Bell,
      color: 'zahav-blue'
    },
    {
      name: 'שלח הודעה',
      description: 'הודעה למשפחה',
      icon: MessageSquare,
      color: 'zahav-orange'
    },
    {
      name: 'העלה זכרון',
      description: 'תמונה או סיפור',
      icon: Camera,
      color: 'zahav-yellow'
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
                דשבורד {profile?.last_name || 'המשפחה'}
              </h1>
              <p className="text-muted-foreground">
                ניהול וטיפול ב{profile?.first_name || 'אבא יקר'}
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
                פעולות מהירות
              </CardTitle>
              <CardDescription>
                הוסף תוכן או תזכורות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3">
                      <action.icon className="w-5 h-5" />
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {action.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
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
      </div>
    </div>
  );
};

export default FamilyDashboard;