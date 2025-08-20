import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountModal from '@/components/AccountModal';

interface NavigationHeaderProps {
  currentView: 'elderly' | 'family';
  onViewChange: (view: 'elderly' | 'family') => void;
  onSettingsClick: () => void;
}

const NavigationHeader = ({ currentView, onViewChange, onSettingsClick }: NavigationHeaderProps) => {
  const { authState, loginAsMainUser, loginAsFamily, logout } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleMainUserLogin = () => {
    loginAsMainUser();
    navigate('/home');
  };

  const handleFamilyLogin = () => {
    loginAsFamily();
    navigate('/family');
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
              variant={currentView === 'elderly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('elderly')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">ממשק משתמש</span>
            </Button>
            <Button
              variant={currentView === 'family' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('family')}
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
                  onClick={handleMainUserLogin}
                  className="text-sm"
                >
                  כניסה כמשתמש ראשי
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleFamilyLogin}
                  className="text-sm"
                >
                  כניסה כבן משפחה
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground p-2 rounded-lg transition-colors"
                >
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    שלום {authState.firstName} · מחובר
                  </Badge>
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
    </div>
  );
};

export default NavigationHeader;