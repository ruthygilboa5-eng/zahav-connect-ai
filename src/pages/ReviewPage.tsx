import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Image, 
  FileText, 
  Clock as Reminder,
  Gamepad2,
  Home,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFamilyProvider } from '@/providers/FamilyProvider';
import { PendingItem } from '@/types/family';
import { useToast } from '@/hooks/use-toast';

const ReviewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pendingQueue, approvePendingItem, rejectPendingItem } = useFamilyProvider();
  const [selectedTab, setSelectedTab] = useState('pending');

  const pendingItems = pendingQueue.filter(item => !item.status || item.status === 'PENDING');
  const approvedItems = pendingQueue.filter(item => item.status === 'APPROVED');
  const rejectedItems = pendingQueue.filter(item => item.status === 'REJECTED');

  const getItemIcon = (type: PendingItem['type']) => {
    switch (type) {
      case 'MEDIA':
        return <Image className="w-5 h-5" />;
      case 'STORY':
        return <FileText className="w-5 h-5" />;
      case 'REMINDER':
        return <Reminder className="w-5 h-5" />;
      case 'GAME_INVITE':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getItemTypeLabel = (type: PendingItem['type']) => {
    switch (type) {
      case 'MEDIA':
        return 'תמונה/וידאו';
      case 'STORY':
        return 'סיפור';
      case 'REMINDER':
        return 'תזכורת';
      case 'GAME_INVITE':
        return 'הזמנה למשחק';
      default:
        return 'פריט';
    }
  };

  const handleApprove = (item: PendingItem) => {
    approvePendingItem(item.id);
    toast({
      title: "פריט אושר",
      description: `${getItemTypeLabel(item.type)} מ${item.fromMemberName} אושר בהצלחה`,
    });
  };

  const handleReject = (item: PendingItem) => {
    rejectPendingItem(item.id);
    toast({
      title: "פריט נדחה",
      description: `${getItemTypeLabel(item.type)} מ${item.fromMemberName} נדחה`,
      variant: "destructive",
    });
  };

  const ItemCard = ({ item, showActions = true }: { item: PendingItem; showActions?: boolean }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getItemIcon(item.type)}
          <div>
            <h3 className="font-bold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground">
              מאת: {item.fromMemberName} • {getItemTypeLabel(item.type)}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(item.submittedAt).toLocaleDateString('he-IL')}
        </div>
      </div>
      
      <p className="text-foreground mb-4 leading-relaxed">{item.content}</p>
      
      {item.metadata?.imageUrl && (
        <div className="mb-4">
          <img 
            src={item.metadata.imageUrl} 
            alt={item.title}
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}

      {showActions && (
        <div className="flex gap-2">
          <Button
            onClick={() => handleApprove(item)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            אשר
          </Button>
          <Button
            onClick={() => handleReject(item)}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 ml-2" />
            דחה
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="p-4 rtl-text min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            אישור תוכן משפחתי
          </h1>
          <p className="text-xl text-muted-foreground">
            בדוק ואשר תוכן שבני המשפחה העלו
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ממתין ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              מאושר ({approvedItems.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              נדחה ({rejectedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  אין פריטים ממתינים
                </h3>
                <p className="text-muted-foreground">
                  כל התוכן שהועלה ע"י המשפחה אושר או נדחה
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-6">
            {approvedItems.length > 0 ? (
              approvedItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard item={item} showActions={false} />
                  <Badge className="absolute top-2 left-2 bg-green-100 text-green-800">
                    מאושר
                  </Badge>
                </div>
              ))
            ) : (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  אין פריטים מאושרים
                </h3>
                <p className="text-muted-foreground">
                  פריטים שתאשר יופיעו כאן
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            {rejectedItems.length > 0 ? (
              rejectedItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard item={item} showActions={false} />
                  <Badge className="absolute top-2 left-2 bg-red-100 text-red-800">
                    נדחה
                  </Badge>
                </div>
              ))
            ) : (
              <Card className="p-8 text-center">
                <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  אין פריטים נדחים
                </h3>
                <p className="text-muted-foreground">
                  פריטים שתדחה יופיעו כאן
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Button
          onClick={() => navigate('/home')}
          variant="outline"
          className="w-full"
        >
          <Home className="w-5 h-5 ml-2" />
          חזרה לעמוד הראשי
        </Button>
      </div>
    </div>
  );
};

export default ReviewPage;