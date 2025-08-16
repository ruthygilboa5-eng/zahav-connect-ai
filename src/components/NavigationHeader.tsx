import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Heart, Settings } from 'lucide-react';

interface NavigationHeaderProps {
  currentView: 'elderly' | 'family';
  onViewChange: (view: 'elderly' | 'family') => void;
  onSettingsClick: () => void;
}

const NavigationHeader = ({ currentView, onViewChange, onSettingsClick }: NavigationHeaderProps) => {
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
              <Heart className="w-6 h-6 text-primary-foreground" />
            </button>
            <div className="rtl-text">
              <h1 className="text-xl font-bold text-foreground">ZAHAV</h1>
              <p className="text-xs text-muted-foreground">חיבור לגיל השלישי</p>
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

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <Badge className="bg-zahav-green text-white">
              מחובר
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;