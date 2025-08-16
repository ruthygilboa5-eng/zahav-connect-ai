import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Pill, Calendar, Gift, Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders] = useState([
    {
      id: 1,
      type: 'medicine',
      title: 'תרופת לחץ דם',
      time: '08:00',
      description: 'קח עם כוס מים',
      icon: Pill,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'פגישה עם רופא המשפחה',
      time: '14:30',
      description: 'מחר - ביום רביעי',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'birthday',
      title: 'יום הולדת של נועה',
      time: '10:00',
      description: 'הנכדה - 5 שנים',
      icon: Gift,
      color: 'text-pink-600'
    }
  ]);

  return (
    <div className="min-h-screen bg-background p-4 rtl-text">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Bell className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            תזכורות
          </h1>
          <p className="text-xl text-muted-foreground">
            תזכורות לתרופות, פגישות ואירועים
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-full">
                  <reminder.icon className={`w-6 h-6 ${reminder.color}`} />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg font-bold text-foreground">
                    {reminder.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {reminder.description}
                  </p>
                  <div className="text-primary font-bold text-lg mt-1">
                    {reminder.time}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="text-center">
            <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-blue-800 mb-2">
              תזכורות אוטומטיות
            </h3>
            <p className="text-blue-700 text-sm">
              המערכת תזכיר לך על תרופות ופגישות בזמן האמיתי
            </p>
          </div>
        </Card>

        <Button
          className="w-full mb-4 bg-primary text-primary-foreground"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף תזכורת חדשה
        </Button>

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

export default RemindersPage;