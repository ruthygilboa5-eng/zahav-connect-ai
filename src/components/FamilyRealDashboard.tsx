import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
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
}

const FamilyRealDashboard = () => {
  const { authState } = useAuth();
  const { toast } = useToast();
  const [familyLink, setFamilyLink] = useState<FamilyLink | null>(null);
  const [mainUserProfile, setMainUserProfile] = useState<MainUserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE'>('MEDIA');
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  
  // Permission states
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    loadFamilyData();
    loadPermissions();
  }, [authState.user?.id]);

  const loadPermissions = async () => {
    if (!authState.user?.id) return;

    try {
      setPermissionsLoading(true);

      // Get family link for current user
      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')
        .select('id')
        .eq('member_user_id', authState.user.id)
        .single();

      if (linkError || !familyLink) {
        console.error('Error finding family link:', linkError);
        return;
      }

      // Get permissions for this family member
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('family_members_permissions')
        .select('*')
        .eq('family_member_id', familyLink.id)
        .order('created_at', { ascending: false });

      if (permissionsError) throw permissionsError;

      setPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const requestPermission = async (feature: string) => {
    if (!authState.user?.id) return;

    try {
      // Get family link
      const { data: familyLink, error: linkError } = await supabase
        .from('family_links')  
        .select('id')
        .eq('member_user_id', authState.user.id)
        .single();

      if (linkError || !familyLink) {
        throw new Error('לא נמצא קישור משפחתי');
      }

      // Check if there's already a pending request for this feature
      const existingRequest = permissions.find(p => 
        p.feature === feature && p.status === 'pending'
      );

      if (existingRequest) {
        toast({
          title: 'בקשה קיימת',
          description: 'כבר נשלחה בקשה עבור פיצ\'ר זה וממתינה לאישור',
          variant: 'default'
        });
        return;
      }

      // Create new permission request
      const { error } = await supabase
        .from('family_members_permissions')
        .insert({
          family_member_id: familyLink.id,
          feature,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'בקשה נשלחה',
        description: 'בקשתך נשלחה למשתמש הראשי לבדיקה',
      });

      // Reload permissions
      await loadPermissions();
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשליחת הבקשה',
        variant: 'destructive'
      });
    }
  };

  const getPermissionStatus = (feature: string): 'none' | 'pending' | 'approved' | 'rejected' => {
    const permission = permissions
      .filter(p => p.feature === feature)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return permission?.status || 'none';
  };

  const hasPermission = (feature: string): boolean => {
    return getPermissionStatus(feature) === 'approved';
  };

  const loadFamilyData = async () => {
    if (!authState.user?.id) return;

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
          .single();

        if (profileError) {
          console.error('Error loading main user profile:', profileError);
        } else {
          setMainUserProfile(profileData);
        }

        // Load recent activities (memories, reminders)
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

  return (
    <>
      {/* Real Mode Banner */}
      <div className="w-full bg-green-50 border-b border-green-200 py-2">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-green-800 font-medium">
            🟢 מצב אמיתי – נתונים מחוברים לחשבון שלך
          </p>
        </div>
      </div>

      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              שלום {familyLink.full_name}
            </h1>
            {mainUserProfile && (
              <p className="text-muted-foreground">
                מחובר לחשבון של {mainUserProfile.display_name || `${mainUserProfile.first_name} ${mainUserProfile.last_name}`}
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsProfileSettingsOpen(true)}
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
            {/* Permissions Section */}
            <Card>
              <CardHeader>
                <CardTitle>הרשאות גישה</CardTitle>
                <CardDescription>
                  נהל את ההרשאות שלך לפיצ'רים שונים במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['memories', 'games', 'reminders', 'emergency', 'contacts', 'wakeup'].map((feature) => (
                    <PermissionCard
                      key={feature}
                      feature={feature}
                      status={getPermissionStatus(feature)}
                      onRequestPermission={() => requestPermission(feature)}
                      disabled={permissionsLoading}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Section - Only show if user has approved permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Activity */}
              <Card className="md:col-span-2">
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
                        <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
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
                      <p className="text-muted-foreground text-sm">
                        אין פעילות אחרונה
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Family Actions - Only show approved ones */}
              {familyActions
                .filter(action => hasPermission(action.scope.toLowerCase().replace('post_', '').replace('suggest_', '')))
                .map((action, index) => (
                <ActionCard
                  key={index}
                  scope={action.scope}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  onAction={action.onAction}
                  primaryLabel={action.primaryLabel}
                />
              ))}
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>סטטוס המערכת</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <p className="text-sm font-medium">מחובר</p>
                    <p className="text-xs text-muted-foreground">חיבור יציב</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{familyLink.scopes?.length || 0}</div>
                    <p className="text-sm font-medium">הרשאות</p>
                    <p className="text-xs text-muted-foreground">הרשאות פעילות</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <p className="text-sm font-medium">התראות</p>
                    <p className="text-xs text-muted-foreground">אין התראות חדשות</p>
                  </div>
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