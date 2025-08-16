import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Pill, Calendar, Gift, Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReminderStatus {
  id: number;
  completed: boolean;
  note: string;
}

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

  const [reminderStatuses, setReminderStatuses] = useState<ReminderStatus[]>(
    reminders.map(reminder => ({ id: reminder.id, completed: false, note: '' }))
  );

  const updateReminderStatus = (id: number, completed: boolean) => {
    setReminderStatuses(prev => 
      prev.map(status => 
        status.id === id ? { ...status, completed, note: completed ? '' : status.note } : status
      )
    );
  };

  const updateReminderNote = (id: number, note: string) => {
    setReminderStatuses(prev => 
      prev.map(status => 
        status.id === id ? { ...status, note } : status
      )
    );
  };

  const getReminderStatus = (id: number) => {
    return reminderStatuses.find(status => status.id === id) || { completed: false, note: '' };
  };

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
          {reminders.map((reminder) => {
            const status = getReminderStatus(reminder.id);
            return (
              <Card key={reminder.id} className={`p-4 ${status.completed ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <reminder.icon className={`w-6 h-6 ${reminder.color}`} />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className={`text-lg font-bold ${status.completed ? 'text-green-700 line-through' : 'text-foreground'}`}>
                        {reminder.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {reminder.description}
                      </p>
                      <div className="text-primary font-bold text-lg mt-1">
                        {reminder.time}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`reminder-${reminder.id}`}
                        checked={status.completed}
                        onCheckedChange={(checked) => updateReminderStatus(reminder.id, checked as boolean)}
                      />
                      <label htmlFor={`reminder-${reminder.id}`} className="text-sm font-medium">
                        {status.completed ? 'בוצע' : 'סמן כבוצע'}
                      </label>
                    </div>
                  </div>
                  
                  {!status.completed && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        הערות (אופציונלי):
                      </label>
                      <Textarea
                        value={status.note}
                        onChange={(e) => updateReminderNote(reminder.id, e.target.value)}
                        placeholder="הוסף הערה אם התזכורת לא בוצעה..."
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
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