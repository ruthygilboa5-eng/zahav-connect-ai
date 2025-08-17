import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Users,
  LogOut,
  Phone,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MainUserProfile {
  first_name: string;
  last_name: string;
  user_id: string;
}

interface ActivityLog {
  id: string;
  type: 'wakeup' | 'emergency' | 'reminder' | 'memory' | 'game' | 'message';
  message: string;
  timestamp: string;
  status: 'active' | 'completed' | 'missed';
}

const FamilyDashboardPage = () => {
  const { user, signOut, userRole } = useAuth();
  const { toast } = useToast();
  const [mainUserProfile, setMainUserProfile] = useState<MainUserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [lastActivity, setLastActivity] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMainUserData = async () => {
      if (!user) return;

      try {
        // Find the main user who granted access to this family member
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('granted_by_user_id')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData?.granted_by_user_id) {
          console.error('Error fetching role data:', roleError);
          return;
        }

        // Fetch main user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, user_id')
          .eq('user_id', roleData.granted_by_user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        setMainUserProfile(profileData);
        
        // Set sample activities (in production, these would come from actual user activity)
        setActivities([
          {
            id: '1',
            type: 'wakeup',
            message: 'הדווח שהוא בסדר',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          },
          {
            id: '2',
            type: 'reminder',
            message: 'תזכורת לתרופת לחץ דם - לא נענה',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'missed'
          },
          {
            id: '3',
            type: 'memory',
            message: 'צפה בתמונות מהנכדים',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          }
        ]);

        setLastActivity('פעיל היום');
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את נתוני המשתמש הראשי",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMainUserData();
  }, [user, toast]);

  const getActivityIcon = (type: ActivityLog['type']) => {
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

  const getStatusColor = (status: ActivityLog['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'missed': return 'bg-red-500 text-white';
      case 'active': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: ActivityLog['status']) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'missed': return 'הוחמץ';
      case 'active': return 'פעיל';
      default: return 'לא ידוע';
    }
  };

  const quickActions = [
    {
      name: 'שלח הודעה',
      description: 'הודעה למשתמש הראשי',
      icon: MessageSquare,
      action: () => toast({ title: "בקרוב", description: "תכונה זו תהיה זמינה בקרוב" })
    },
    {
      name: 'הצע תזכורת',
      description: 'תרופות או פגישות',
      icon: Bell,
      action: () => toast({ title: "בקרוב", description: "תכונה זו תהיה זמינה בקרוב" })
    },
    {
      name: 'שתף זכרון',
      description: 'תמונה או סיפור',
      icon: Camera,
      action: () => toast({ title: "בקרוב", description: "תכונה זו תהיה זמינה בקרוב" })
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!mainUserProfile) {
    return (
      <div className="min-h-screen bg-background p-6 rtl-text">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              לא נמצא משתמש ראשי שהעניק לך גישה. אנא פנה למנהל המערכת.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 rtl-text">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                דשבורד {mainUserProfile.last_name}
              </h1>
              <p className="text-muted-foreground">
                מעקב וטיפול ב{mainUserProfile.first_name}
              </p>
              <Badge variant="outline" className="mt-1">
                {userRole === 'family_emergency' ? 'איש קשר חירום' : 'בן משפחה'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              יציאה
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                פעילות היום
              </CardTitle>
              <CardDescription>
                סיכום פעילויות ותזכורות של היום
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    עדיין אין פעילות היום
                  </div>
                ) : (
                  activities.map((activity) => (
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
                  ))
                )}
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
                שליחת הודעות ותזכורות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={action.action}
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
                תמונות וסיפורים משותפים
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
                <CheckCircle className="w-5 h-5 text-green-500" />
                מצב המערכת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">פעילות אחרונה</span>
                  <Badge className="bg-green-500 text-white">{lastActivity}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">סטטוס התקן</span>
                  <Badge className="bg-green-500 text-white">מחובר</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">תזכורות היום</span>
                  <Badge variant="outline">2/4</Badge>
                </div>
                <Separator />
                {userRole === 'family_emergency' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">חירום</span>
                    <Badge className="bg-green-500 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      פעיל
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {userRole === 'family_emergency' && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Phone className="w-5 h-5" />
                איש קשר לחירום
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 text-sm mb-4">
                אתה מוגדר כאיש קשר לחירום. בזמן SOS תקבל התראה מיידית ותוכל לחייג ישירות.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  <Phone className="w-4 h-4 mr-2" />
                  חיוג מהיר
                </Button>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  הודעת חירום
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FamilyDashboardPage;