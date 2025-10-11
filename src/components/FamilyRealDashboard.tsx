import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useFamilyPermissions } from '@/hooks/useFamilyPermissions';
import { 
  Camera, MessageSquare, Calendar, Gamepad2, 
  Heart, Upload, User, Settings, Clock, Shield, CheckCircle, XCircle
} from 'lucide-react';
import ActionCard from '@/components/ActionCard';
import ContentUploadModal from '@/components/ContentUploadModal';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import PermissionCard from '@/components/PermissionCard';

interface FamilyLink {
  id: string;
  full_name: string;
  owner_user_id: string;
  status: string;
  scopes: string[];
}

interface FamilyMemberData {
  id: string;
  full_name: string;
  relationship_label: string;
  gender: string;
  email: string;
}

interface MainUserProfile {
  first_name: string;
  last_name: string;
  display_name: string;
}

interface Activity {
  id: string;
  type: 'memory' | 'reminder' | 'message';
  title: string;
  description: string;
  timestamp: string;
  shared_with_family_id?: string;
}

const FamilyRealDashboard = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    requestPermission, 
    getPermissionStatus, 
    hasPermission, 
    loading: permissionsLoading 
  } = useFamilyPermissions();
  const [familyLink, setFamilyLink] = useState<FamilyLink | null>(null);
  const [familyMemberData, setFamilyMemberData] = useState<FamilyMemberData | null>(null);
  const [mainUserProfile, setMainUserProfile] = useState<MainUserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE'>('MEDIA');
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  
  // Demo mode flag: when no authenticated user exists
  const isDemo = !authState.user?.id;
  
  // Remove the old permission states and functions since we're using the hook now

  useEffect(() => {
    loadFamilyData();

    // Set up real-time subscription for family link updates
    const channel = supabase
      .channel('family-link-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_links'
        },
        (payload) => {
          console.log('Family link change received:', payload);
          loadFamilyData(); // Reload when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState.user?.id]);

  const loadFamilyData = async () => {
    // Demo mode fallback: no authenticated user
    if (!authState.user?.id) {
      setFamilyLink({
        id: 'demo',
        full_name: 'בן משפחה',
        owner_user_id: 'demo-main-user',
        status: 'APPROVED',
        scopes: ['memories','games','reminders','emergency','contacts','wakeup']
      });
      setMainUserProfile({ first_name: 'משתמש', last_name: 'ראשי', display_name: 'משתמש ראשי' });
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get family link information
      const { data: linkData, error: linkError } = await supabase
        .from('family_links')
        .select('*')
        .eq('member_user_id', authState.user.id)
        .single();

      if (linkError) {
        console.error('Error loading family link:', linkError);
        return;
      }

      setFamilyLink(linkData);

      // Get main user profile
      if (linkData.owner_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, display_name')
          .eq('user_id', linkData.owner_user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading main user profile:', profileError);
        } else if (profileData) {
          setMainUserProfile(profileData);
        } else {
          // No profile found - create a fallback
          setMainUserProfile({
            first_name: 'משתמש',
            last_name: 'ראשי',
            display_name: 'משתמש ראשי'
          });
        }

        // Load shared activities - for now, load all activities from the main user
        const { data: memoriesData } = await supabase
          .from('memories')
          .select('*')
          .eq('owner_user_id', linkData.owner_user_id)
          .order('created_at', { ascending: false })
          .limit(3);

        const { data: remindersData } = await supabase
          .from('reminders')
          .select('*')
          .eq('owner_user_id', linkData.owner_user_id)
          .order('created_at', { ascending: false })
          .limit(3);

        const combinedActivities: Activity[] = [
          ...(memoriesData || []).map(memory => ({
            id: memory.id,
            type: 'memory' as const,
            title: memory.title,
            description: memory.description || '',
            timestamp: memory.created_at
          })),
          ...(remindersData || []).map(reminder => ({
            id: reminder.id,
            type: 'reminder' as const,
            title: reminder.title,
            description: reminder.description || '',
            timestamp: reminder.created_at
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setActivities(combinedActivities);
      }

    } catch (error) {
      console.error('Error loading family data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני המשפחה',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionHandler = (key: string) => {
    const handlers: Record<string, () => void> = {
      'upload-photo': () => {
        setUploadType('MEDIA');
        setUploadModalOpen(true);
      },
      'upload-video': () => {
        setUploadType('MEDIA');
        setUploadModalOpen(true);
      },
      'send-message': () => {
        toast({
          title: 'הודעה',
          description: 'תכונת שליחת הודעות תהיה זמינה בקרוב'
        });
      },
      'share-story': () => {
        setUploadType('STORY');
        setUploadModalOpen(true);
      },
      'set-reminder': () => {
        setUploadType('REMINDER');
        setUploadModalOpen(true);
      },
      'play-games': () => {
        toast({
          title: 'הודעה',
          description: 'תכונת המשחקים תהיה זמינה בקרוב'
        });
      }
    };
    return handlers[key] || (() => {});
  };

  const getActionIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Camera, MessageSquare, Calendar, Gamepad2, Heart, Upload
    };
    return iconMap[iconName] || Camera;
  };

  const familyActions = [
    {
      scope: 'POST_MEDIA' as const,
      title: 'העלה תמונה',
      description: 'שתף תמונות יפות עם המשפחה',
      icon: Camera,
      onAction: getActionHandler('upload-photo'),
      primaryLabel: 'העלה עכשיו'
    },
    {
      scope: 'POST_MEDIA' as const,
      title: 'העלה סרטון',
      description: 'שתף סרטונים מיוחדים',
      icon: Upload,
      onAction: getActionHandler('upload-video'),
      primaryLabel: 'העלה עכשיו'
    },
    {
      scope: 'CHAT' as const,
      title: 'שלח הודעה',
      description: 'שלח הודעה חמה למשפחה',
      icon: MessageSquare,
      onAction: getActionHandler('send-message'),
      primaryLabel: 'שלח הודעה'
    },
    {
      scope: 'POST_STORY' as const,
      title: 'שתף סיפור',
      description: 'שתף זיכרון או סיפור מיוחד',
      icon: Heart,
      onAction: getActionHandler('share-story'),
      primaryLabel: 'שתף עכשיו'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600';
      case 'PENDING': return 'text-yellow-600';
      case 'DECLINED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'מאושר';
      case 'PENDING': return 'ממתין לאישור';
      case 'DECLINED': return 'נדחה';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (!familyLink) {
    return (
      <div className="container mx-auto py-8" dir="rtl">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">שגיאה</CardTitle>
            <CardDescription>
              לא נמצא קישור משפחתי עבור המשתמש הזה
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Feature buttons configuration with icons and actions
  const featureButtons = [
    {
      id: 'memories',
      name: 'זכרונות',
      description: 'תמונות וידאו וסיפורים',
      icon: Heart,
      feature: 'memories',
      action: () => navigate('/memories')
    },
    {
      id: 'reminders',
      name: 'תזכורות',
      description: 'תזכורות למשתמש הראשי',
      icon: Calendar,
      feature: 'reminders',
      action: () => navigate('/reminders')
    },
    {
      id: 'games',
      name: 'משחקים',
      description: 'משחקים עם המשפחה',
      icon: Gamepad2,
      feature: 'games',
      action: () => navigate('/games')
    },
    {
      id: 'chat',
      name: 'צ\'ט משפחתי',
      description: 'שיחה עם בני המשפחה',
      icon: MessageSquare,
      feature: 'chat',
      action: () => toast({ title: 'הודעה', description: 'תכונת הצ\'ט תהיה זמינה בקרוב' })
    },
    {
      id: 'emergency',
      name: 'התראות חירום',
      description: 'התראות חירום',
      icon: Shield,
      feature: 'emergency',
      action: () => navigate('/emergency')
    },
    {
      id: 'wakeup',
      name: 'התעוררות',
      description: 'דיווח התעוררות יומי',
      icon: Clock,
      feature: 'wakeup',
      action: () => navigate('/wakeup')
    }
  ];

  return (
    <>
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              שלום {(familyLink.full_name || '').split(' ')[0] || 'בן משפחה'}
            </h1>
            <p className="text-muted-foreground">
              מחובר/ת לחשבון של {mainUserProfile ? 
                (mainUserProfile.display_name || `${mainUserProfile.first_name} ${mainUserProfile.last_name}`.trim()) : 
                'המשתמש הראשי'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/family-profile-real')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            פרופיל
          </Button>
        </div>

        {/* Connection Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">סטטוס חיבור</p>
                <p className="text-sm text-muted-foreground">
                  מצב הקישור למשפחה
                </p>
              </div>
              <Badge className={getStatusColor(familyLink.status)}>
                {getStatusText(familyLink.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {familyLink.status === 'APPROVED' ? (
          <>
            {/* Info Banner */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h2 className="text-xl font-bold mb-2">סטטוס חיבור</h2>
                  <Badge className="bg-green-100 text-green-800 border-green-200">מחובר למערכת</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature Buttons in Circle Layout */}
            <div className="flex items-center justify-center my-12">
              <div className="relative" style={{ width: '550px', height: '550px' }}>
                {featureButtons.map((button, index) => {
                  const angle = (index * 360) / featureButtons.length;
                  const radius = 200;
                  const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                  const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
                  const permissionStatus = getPermissionStatus(button.feature);
                  const isApproved = isDemo || permissionStatus === 'approved';
                  const isPending = permissionStatus === 'pending';
                  
                  const IconComponent = button.icon;
                  
                  return (
                    <div
                      key={button.id}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <button
                        onClick={() => {
                          if (isApproved) {
                            button.action();
                          } else if (!isPending) {
                            requestPermission(button.feature);
                          }
                        }}
                        disabled={permissionsLoading || isPending}
                        className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 transition-all ${
                          isApproved 
                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 shadow-lg text-gray-800' 
                            : isPending
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-dashed border-gray-300'
                        }`}
                      >
                        <IconComponent className="h-10 w-10" />
                        <span className="text-sm font-bold text-center px-2">
                          {isApproved ? button.name : isPending ? 'ממתין...' : 'לחץ לבקשה'}
                        </span>
                        {isApproved && <CheckCircle className="h-5 w-5 text-green-600 absolute -top-1 -right-1" />}
                        {isPending && <Clock className="h-5 w-5 text-orange-500 absolute -top-1 -right-1" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle>פעילות אחרונה</CardTitle>
                <CardDescription>
                  עדכונים מהמשפחה
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0">
                          {activity.type === 'memory' && <Heart className="h-5 w-5 text-pink-500" />}
                          {activity.type === 'reminder' && <Calendar className="h-5 w-5 text-blue-500" />}
                          {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      אין פעילויות משותפות עבורך להיום
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>בקשה ממתינה לאישור</CardTitle>
              <CardDescription>
                הבקשה שלך הועברה למשתמש הראשי ומחכה לאישור
              </CardDescription>
            </CardHeader>
          </Card>
        )}

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
    </>
  );
};

export default FamilyRealDashboard;