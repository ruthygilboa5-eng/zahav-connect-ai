import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Home, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  type: 'family' | 'user';
}

const FamilyBoardPage = () => {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'רותי',
      content: 'שלום! איך אתה מרגיש היום?',
      timestamp: '10:30',
      type: 'family'
    },
    {
      id: 2,
      sender: 'דני',
      content: 'סבא, תודה על הסיפור הנפלא אתמול!',
      timestamp: '11:15',
      type: 'family'
    },
    {
      id: 3,
      sender: 'משתמש',
      content: 'הכל בסדר, תודה! מחכה לראות אתכם',
      timestamp: '11:45',
      type: 'user'
    }
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        sender: 'משתמש',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'user'
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 rtl-text min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            לוח מודעות משפחתי
          </h1>
          <p className="text-xl text-muted-foreground">
            הודעות עם המשפחה
          </p>
        </div>

        {/* Messages List */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`p-4 ${
                message.type === 'user' 
                  ? 'bg-primary/10 border-primary/30 ml-8' 
                  : 'bg-muted/50 mr-8'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`text-sm font-bold ${
                  message.type === 'user' ? 'text-primary' : 'text-foreground'
                }`}>
                  {message.sender}
                </div>
                <div className="text-xs text-muted-foreground">
                  {message.timestamp}
                </div>
              </div>
              <p className="text-foreground leading-relaxed">
                {message.content}
              </p>
              {message.type === 'family' && (
                <Heart className="w-4 h-4 text-red-500 mt-2" />
              )}
            </Card>
          ))}
        </div>

        {/* Message Input */}
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="כתוב הודעה למשפחה..."
              className="resize-none rtl-text"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-full bg-primary text-primary-foreground"
            >
              <Send className="w-5 h-5 ml-2" />
              שלח הודעה
            </Button>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="text-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-blue-800 mb-2">
              צ'אט משפחתי
            </h3>
            <p className="text-blue-700 text-sm">
              כאן תוכל לשוחח עם בני המשפחה ולקבל הודעות חמות מהם
            </p>
          </div>
        </Card>

        <Button
          onClick={() => navigate('/')}
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

export default FamilyBoardPage;