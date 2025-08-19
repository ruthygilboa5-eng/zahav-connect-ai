import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldX, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const AccessDeniedModal = ({ isOpen, onClose, message }: AccessDeniedModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rtl-text text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-red-600">
            <ShieldX className="w-6 h-6" />
            אין הרשאה
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6 bg-red-50 border-red-200">
          <div className="space-y-4">
            <ShieldX className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-2">
                פעולה לא מורשית
              </h3>
              <p className="text-red-700">
                {message || 'אין לך הרשאה לבצע פעולה זו. פנה למשתמש הראשי להפעלת ההרשאה.'}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button onClick={onClose} className="flex-1">
            הבנתי
          </Button>
          <Button 
            onClick={() => {
              onClose();
              navigate('/');
            }} 
            variant="outline"
            className="flex-1"
          >
            <Home className="w-4 h-4 ml-2" />
            לעמוד הראשי
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessDeniedModal;