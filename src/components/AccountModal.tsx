import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthDisplayName } from '@/hooks/useDisplayName';
import { User, Mail, Phone } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const { authState, logout } = useAuth();
  const displayName = useAuthDisplayName();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/', { replace: true });
  };

  const roleDisplay = authState.role === 'MAIN_USER' ? 'משתמש ראשי' : 'משתמש';
  const mockEmail = authState.role === 'MAIN_USER' ? 'user@zahav.com' : 'family@zahav.com';
  const mockPhone = authState.role === 'MAIN_USER' ? '050-1234567' : '052-7654321';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">פרטי חשבון</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">שלום {displayName}</h3>
              <Badge variant="secondary">{roleDisplay}</Badge>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">שם פרטי</label>
                <p className="text-base">{authState.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">שם משפחה</label>
                <p className="text-base">User</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">אימייל</label>
                  <p className="text-base">{mockEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">טלפון</label>
                  <p className="text-base">{mockPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              variant="default" 
              onClick={() => {
                onClose();
                navigate(authState.role === 'MAIN_USER' ? '/main-user-profile' : '/family-member-profile');
              }}
              className="w-full"
            >
              עבור לפרופיל
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                סגירה
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex-1">
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;