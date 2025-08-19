import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Image, 
  FileText, 
  Clock, 
  Gamepad2,
  Home,
  MessageSquare,
  Upload,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { FamilyScope } from '@/types/family';
import ContentUploadModal from '@/components/ContentUploadModal';
import FamilyMemberNotifications from '@/components/FamilyMemberNotifications';
import RoleBasedDisplay from '@/components/RoleBasedDisplay';

const FamilyDashboardPage = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { getMemberScopes, canMemberPerformAction } = useFamilyProvider();
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE'>('MEDIA');

  const memberScopes = authState.memberId ? getMemberScopes(authState.memberId) : [];

  const openUploadModal = (type: typeof uploadType) => {
    setUploadType(type);
    setUploadModalOpen(true);
  };

  const getScopeLabel = (scope: FamilyScope) => {
    switch (scope) {
      case 'POST_MEDIA':
        return 'העלאת תמונות וסיפורים';
      case 'SUGGEST_REMINDER':
        return 'הצעת תזכורות';
      case 'PLAY_GAMES':
        return 'הזמנת משחקים';
      case 'EMERGENCY_ONLY':
        return 'התראות חירום בלבד';
      default:
        return scope;
    }
  };

  const canPostMedia = canMemberPerformAction(authState.memberId || '', 'POST_MEDIA');
  const canSuggestReminder = canMemberPerformAction(authState.memberId || '', 'SUGGEST_REMINDER');
  const canPlayGames = canMemberPerformAction(authState.memberId || '', 'PLAY_GAMES');

  return (
    <div className="p-4 rtl-text min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-16 h-16 text-primary" />
            <FamilyMemberNotifications />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            דשבורד משפחה
          </h1>
          <p className="text-xl text-muted-foreground">
            שלום {authState.role === 'FAMILY' ? 'בן משפחה יקר' : 'משתמש יקר'}
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-bold text-blue-800">סטטוס חיבור</h3>
              <p className="text-sm text-blue-700">
                פעילות אחרונה: היום בערב
              </p>
            </div>
          </div>
        </Card>

        {/* Action Cards */}
        <div className="space-y-4 mb-6">
          {canPostMedia && (
            <>
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openUploadModal('MEDIA')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">העלאת תמונות</h3>
                    <p className="text-sm text-muted-foreground">
                      שתף תמונות יפות עם המשפחה
                    </p>
                  </div>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openUploadModal('STORY')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">שיתוף סיפור</h3>
                    <p className="text-sm text-muted-foreground">
                      ספר סיפור מעניין מהחיים
                    </p>
                  </div>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </>
          )}

          {canSuggestReminder && (
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openUploadModal('REMINDER')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">הצעת תזכורת</h3>
                  <p className="text-sm text-muted-foreground">
                    הצע תזכורת לתרופה או פגישה
                  </p>
                </div>
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {canPlayGames && (
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openUploadModal('GAME_INVITE')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">הזמנה למשחק</h3>
                  <p className="text-sm text-muted-foreground">
                    הזמן למשחק משותף וכיף
                  </p>
                </div>
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          )}
        </div>

        {/* Chat Button */}
        <Card className="p-4 mb-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/family-board')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">צ'אט משפחתי</h3>
              <p className="text-sm text-muted-foreground">
                שוחח עם כל המשפחה
              </p>
            </div>
          </div>
        </Card>

        {/* Permissions Info */}
        <Card className="p-4 mb-6 bg-gray-50 border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">ההרשאות שלך:</h3>
          <div className="space-y-2">
            {memberScopes.length > 0 ? (
              memberScopes.map((scope, index) => (
                <Badge key={index} variant="secondary" className="mr-2">
                  {getScopeLabel(scope)}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-600">
                התראות חירום בלבד
              </p>
            )}
          </div>
        </Card>

        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full"
        >
          <Home className="w-5 h-5 ml-2" />
          יציאה
        </Button>

        <ContentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          contentType={uploadType}
        />
      </div>
    </div>
  );
};

export default FamilyDashboardPage;