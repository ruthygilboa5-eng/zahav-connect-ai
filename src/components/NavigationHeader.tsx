import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthDisplayName } from '@/hooks/useDisplayName';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AccountModal from '@/components/AccountModal';
import { AuthModal } from '@/components/AuthModal';
import NotificationBadge from '@/components/NotificationBadge';

interface NavigationHeaderProps {
  currentView: 'elderly' | 'family';
  onViewChange: (view: 'elderly' | 'family') => void;
  onSettingsClick: () => void;
}

const NavigationHeader = ({ currentView, onViewChange, onSettingsClick }: NavigationHeaderProps) => {
  const { authState, logout } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = useAuthDisplayName();
  const { toast } = useToast();

  // Helper function to check active route
  const isActive = (path: string) => {
    if (!location || !location.pathname) return false;
    return location.pathname.startsWith(path);
  };

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleMainUserViewClick = () => {
    if (authState.isAuthenticated && authState.role === 'MAIN_USER') {
      navigate('/home');
    } else if (authState.isAuthenticated && authState.role === 'FAMILY') {
      toast({
        title: 'אין לך הרשאה',
        description: 'רק משתמש ראשי יכול לגשת לאזור זה',
        variant: 'destructive',
      });
    } else {
      onViewChange('elderly');
    }
  };

  const handleFamilyViewClick = () => {
    if (authState.isAuthenticated && authState.role === 'FAMILY') {
      navigate('/family-real');
    } else {
      onViewChange('family');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onSettingsClick}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-6 h-6 text-primary-foreground" />
            </button>
            <div className="rtl-text">
              <h1 className="text-xl font-bold text-foreground">ZAHAV</h1>
              <p className="text-xs text-muted-foreground">משפחתי</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={authState.role === 'MAIN_USER' && isActive('/home') ? 'default' : 'ghost'}
              size="sm"
              onClick={handleMainUserViewClick}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">ממשק משתמש</span>
            </Button>
            <Button
              variant={authState.role === 'FAMILY' && (isActive('/family') || isActive('/family-real')) ? 'default' : 'ghost'}
              size="sm"
              onClick={handleFamilyViewClick}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">דשבורד משפחה</span>
            </Button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {!authState.isAuthenticated ? (
              <>
                <Badge variant="secondary" className="text-sm">
                  מנותק
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAuthClick}
                  className="text-sm"
                >
                  התחבר / הירשם
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAccountModalOpen(true)}
                    className="relative flex items-center gap-2 hover:bg-accent hover:text-accent-foreground p-2 rounded-lg transition-colors"
                  >
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      שלום {displayName || 'משתמש'} · מחובר
                    </Badge>
                    {/* Notification badge for main users with pending requests */}
                    {authState.role === 'MAIN_USER' && (
                      <div className="relative">
                        <NotificationBadge />
                      </div>
                    )}
                  </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">התנתק</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default NavigationHeader;