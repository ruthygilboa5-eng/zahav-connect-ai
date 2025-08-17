import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings, LogOut } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavigationHeaderProps {
  onSettingsClick: () => void;
  onSignOut: () => void;
  user: SupabaseUser | null;
}

const NavigationHeader = ({ onSettingsClick, onSignOut, user }: NavigationHeaderProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="rtl-text">
              <h1 className="text-xl font-bold text-foreground">זהב</h1>
              <p className="text-xs text-muted-foreground">מערכת טיפול לקשישים</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
            >
              <Settings className="w-4 h-4 mr-2" />
              הגדרות
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              יציאה
            </Button>
            <Badge className="bg-green-500 text-white">
              מחובר
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;