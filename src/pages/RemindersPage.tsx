import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Pill, Calendar as CalendarIcon, Gift, Home, Plus, Clock, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderStatus {
  id: number;
  completed: boolean;
  note: string;
}

interface NewReminder {
  title: string;
  description: string;
  date: Date | undefined;
  time: string;
  type: 'medicine' | 'appointment' | 'birthday' | 'other';
  repeatType: 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  repeatInterval: number;
  endDate: Date | undefined;
}

const RemindersPage = () => {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [reminders] = useState([
    {
      id: 1,
      type: 'medicine',
      title: 'תרופת לחץ דם',
      time: '08:00',
      description: 'קח עם כוס מים',
      icon: Pill,
      color: 'text-blue-600',
      repeat: 'יומי',
      nextDue: 'היום'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'פגישה עם רופא המשפחה',
      time: '14:30',
      description: 'מחר - ביום רביעי',
      icon: CalendarIcon,
      color: 'text-green-600',
      repeat: 'חד פעמי',
      nextDue: 'מחר'
    },
    {
      id: 3,
      type: 'birthday',
      title: 'יום הולדת של נועה',
      time: '10:00',
      description: 'הנכדה - 5 שנים',
      icon: Gift,
      color: 'text-pink-600',
      repeat: 'שנתי',
      nextDue: 'בעוד שבוע'
    }
  ]);

  const [newReminder, setNewReminder] = useState<NewReminder>({
    title: '',
    description: '',
    date: undefined,
    time: '',
    type: 'other',
    repeatType: 'none',
    repeatInterval: 1,
    endDate: undefined
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medicine': return Pill;
      case 'appointment': return CalendarIcon;
      case 'birthday': return Gift;
      default: return Bell;
    }
  };

  const getRepeatText = (repeatType: string, interval: number) => {
    switch (repeatType) {
      case 'hourly': return interval === 1 ? 'כל שעה' : `כל ${interval} שעות`;
      case 'daily': return interval === 1 ? 'יומי' : `כל ${interval} ימים`;
      case 'weekly': return interval === 1 ? 'שבועי' : `כל ${interval} שבועות`;
      case 'monthly': return interval === 1 ? 'חודשי' : `כל ${interval} חודשים`;
      case 'custom': return 'התאמה אישית';
      default: return 'חד פעמי';
    }
  };

  const resetNewReminder = () => {
    setNewReminder({
      title: '',
      description: '',
      date: undefined,
      time: '',
      type: 'other',
      repeatType: 'none',
      repeatInterval: 1,
      endDate: undefined
    });
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Amber Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-4 rtl-text min-h-screen">
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
                        <div className="flex items-center gap-4 mt-1">
                          <div className="text-primary font-bold text-lg">
                            {reminder.time}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Repeat className="w-4 h-4" />
                            <span>{reminder.repeat}</span>
                          </div>
                          <div className="text-sm text-orange-600 font-medium">
                            {reminder.nextDue}
                          </div>
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4 bg-primary text-primary-foreground">
                <Plus className="w-5 h-5 ml-2" />
                הוסף תזכורת חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rtl-text">
              <DialogHeader>
                <DialogTitle>הוסף תזכורת חדשה</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="title">כותרת התזכורת</Label>
                  <Input
                    id="title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="לדוגמה: תרופת לחץ דם"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">תיאור</Label>
                  <Input
                    id="description"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="לדוגמה: קח עם כוס מים"
                  />
                </div>

                <div className="space-y-2">
                  <Label>סוג התזכורת</Label>
                  <Select value={newReminder.type} onValueChange={(value) => setNewReminder(prev => ({ ...prev, type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">תרופה</SelectItem>
                      <SelectItem value="appointment">פגישה</SelectItem>
                      <SelectItem value="birthday">יום הולדת</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newReminder.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newReminder.date ? format(newReminder.date, "dd/MM/yyyy") : "בחר תאריך"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newReminder.date}
                          onSelect={(date) => setNewReminder(prev => ({ ...prev, date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">שעה</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Repeat Settings */}
                <div className="space-y-2">
                  <Label>חזרה</Label>
                  <Select value={newReminder.repeatType} onValueChange={(value) => setNewReminder(prev => ({ ...prev, repeatType: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">חד פעמי</SelectItem>
                      <SelectItem value="hourly">כל שעה</SelectItem>
                      <SelectItem value="daily">יומי</SelectItem>
                      <SelectItem value="weekly">שבועי</SelectItem>
                      <SelectItem value="monthly">חודשי</SelectItem>
                      <SelectItem value="custom">התאמה אישית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReminder.repeatType !== 'none' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interval">כל כמה {newReminder.repeatType === 'hourly' ? 'שעות' : newReminder.repeatType === 'daily' ? 'ימים' : newReminder.repeatType === 'weekly' ? 'שבועות' : 'חודשים'}</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={newReminder.repeatInterval}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, repeatInterval: parseInt(e.target.value) || 1 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>תאריך סיום</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newReminder.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newReminder.endDate ? format(newReminder.endDate, "dd/MM/yyyy") : "אופציונלי"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newReminder.endDate}
                            onSelect={(date) => setNewReminder(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      // TODO: Add logic to save reminder
                      console.log('New reminder:', newReminder);
                      resetNewReminder();
                      setIsAddDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    שמור תזכורת
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetNewReminder();
                      setIsAddDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
    </div>
  );
};

export default RemindersPage;