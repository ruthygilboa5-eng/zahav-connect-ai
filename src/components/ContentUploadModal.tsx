import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  Image, 
  FileText, 
  Clock, 
  Gamepad2,
  Send,
  X
} from 'lucide-react';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface ContentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'MEDIA' | 'STORY' | 'REMINDER' | 'GAME_INVITE';
}

const ContentUploadModal = ({ isOpen, onClose, contentType }: ContentUploadModalProps) => {
  const { toast } = useToast();
  const { authState } = useAuth();
  const { addToPendingQueue } = useFamilyProvider();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminderType, setReminderType] = useState<'MEDICATION' | 'APPOINTMENT' | 'EVENT'>('MEDICATION');
  const [gameType, setGameType] = useState('memory');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const getModalTitle = () => {
    switch (contentType) {
      case 'MEDIA':
        return 'העלאת תמונה/וידאו';
      case 'STORY':
        return 'שיתוף סיפור';
      case 'REMINDER':
        return 'הצעת תזכורת';
      case 'GAME_INVITE':
        return 'הזמנה למשחק';
      default:
        return 'העלאת תוכן';
    }
  };

  const getModalIcon = () => {
    switch (contentType) {
      case 'MEDIA':
        return <Image className="w-6 h-6" />;
      case 'STORY':
        return <FileText className="w-6 h-6" />;
      case 'REMINDER':
        return <Clock className="w-6 h-6" />;
      case 'GAME_INVITE':
        return <Gamepad2 className="w-6 h-6" />;
      default:
        return <Upload className="w-6 h-6" />;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין כותרת",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      type: contentType,
      fromMemberId: authState.memberId || 'unknown',
      fromMemberName: authState.role === 'FAMILY' ? 'בן משפחה' : 'משתמש',
      title: title.trim(),
      content: content.trim(),
      submittedAt: new Date().toISOString(),
      metadata: {
        ...(contentType === 'REMINDER' && { reminderType }),
        ...(contentType === 'GAME_INVITE' && { gameType }),
        ...(imagePreview && { imageUrl: imagePreview }),
      }
    };

    addToPendingQueue(newItem);
    
    toast({
      title: "נשלח לאישור",
      description: `${getModalTitle()} נשלח למשתמש הראשי לאישור`,
    });

    // Reset form
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setReminderType('MEDICATION');
    setGameType('memory');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rtl-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                contentType === 'REMINDER' ? 'תזכורת לתרופה...' :
                contentType === 'GAME_INVITE' ? 'בוא נשחק משחק זיכרון!' :
                'כותרת...'
              }
              className="rtl-text"
              required
            />
          </div>

          {contentType === 'REMINDER' && (
            <div>
              <Label htmlFor="reminderType">סוג תזכורת</Label>
              <Select value={reminderType} onValueChange={(value: any) => setReminderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDICATION">תרופה</SelectItem>
                  <SelectItem value="APPOINTMENT">פגישה</SelectItem>
                  <SelectItem value="EVENT">אירוע</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {contentType === 'GAME_INVITE' && (
            <div>
              <Label htmlFor="gameType">סוג משחק</Label>
              <Select value={gameType} onValueChange={setGameType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memory">משחק זיכרון</SelectItem>
                  <SelectItem value="trivia">חידון</SelectItem>
                  <SelectItem value="story">סיפור משותף</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(contentType === 'MEDIA' || contentType === 'STORY') && (
            <div>
              <Label htmlFor="image">תמונה (אופציונלי)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="rtl-text"
              />
              {imagePreview && (
                <div className="mt-2 relative">
                  <img 
                    src={imagePreview} 
                    alt="תצוגה מקדימה"
                    className="max-w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 left-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="content">
              {contentType === 'REMINDER' ? 'פרטי התזכורת' : 'תוכן'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                contentType === 'STORY' ? 'ספר לנו סיפור מעניין...' :
                contentType === 'REMINDER' ? 'מתי ולמה להזכיר...' :
                contentType === 'GAME_INVITE' ? 'בוא נבלה ביחד!' :
                'תוכן...'
              }
              className="resize-none rtl-text"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Send className="w-4 h-4 ml-2" />
              שלח לאישור
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentUploadModal;