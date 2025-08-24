import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, FileText, Video, Image, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoHome } from '@/hooks/useGoHome';

const MemoriesPage = () => {
  const navigate = useNavigate();
  const goHome = useGoHome();

  const memoryCategories = [
    {
      id: 'stories',
      name: 'סיפורים',
      description: 'סיפורי חיים וזכרונות',
      icon: FileText,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      count: 12
    },
    {
      id: 'videos',
      name: 'סרטוני וידאו',
      description: 'סרטונים משפחתיים',
      icon: Video,
      color: 'bg-purple-500 hover:bg-purple-600',
      count: 8
    },
    {
      id: 'photos',
      name: 'תמונות',
      description: 'תמונות משפחתיות',
      icon: Image,
      color: 'bg-green-500 hover:bg-green-600',
      count: 45
    }
  ];

  const recentMemories = [
    {
      id: 1,
      title: 'יום הולדת 80',
      description: 'חגיגת יום הולדת עם כל המשפחה',
      type: 'photo',
      date: 'לפני שבוע'
    },
    {
      id: 2,
      title: 'סיפור על הצבא',
      description: 'זכרונות מתקופת השירות הצבאי',
      type: 'story',
      date: 'לפני שבועיים'
    }
  ];

  return (
    <div className="p-4 rtl-text min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            פינת זכרונות
          </h1>
          <p className="text-xl text-muted-foreground">
            הסיפורים והזכרונות שלך
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">קטגוריות</h2>
          {memoryCategories.map((category) => (
            <Card key={category.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${category.color} rounded-full`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-foreground">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-primary">
                    {category.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    פריטים
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">זכרונות אחרונים</h2>
          <div className="space-y-3">
            {recentMemories.map((memory) => (
              <Card key={memory.id} className="p-4">
                <div className="text-right">
                  <h3 className="text-lg font-bold text-foreground">
                    {memory.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {memory.description}
                  </p>
                  <div className="text-xs text-primary">
                    {memory.date}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button
          onClick={goHome}
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

export default MemoriesPage;