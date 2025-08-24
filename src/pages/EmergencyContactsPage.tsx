import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, Home, Shield, Ambulance, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoHome } from '@/hooks/useGoHome';

const EmergencyContactsPage = () => {
  const navigate = useNavigate();
  const goHome = useGoHome();

  const emergencyContacts = [
    {
      name: 'משטרה',
      number: '100',
      icon: Shield,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'למקרי חירום ובטחון'
    },
    {
      name: 'מד"א',
      number: '101',
      icon: Ambulance,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'עזרה רפואית מיידית'
    },
    {
      name: 'מגן דוד אדום',
      number: '101',
      icon: Heart,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'שירותי חירום רפואיים'
    }
  ];

  const handleCall = (number: string, name: string) => {
    // Create tel: link for mobile devices
    window.location.href = `tel:${number}`;
    console.log(`Calling ${name} at ${number}`);
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen rtl-text">
      <div className="text-center mb-8 max-w-md">
        <Phone className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground mb-2">
          מוקדי חירום
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          לחץ לחיוג מיידי
        </p>

        <div className="space-y-4 mb-8">
          {emergencyContacts.map((contact) => (
            <Card key={contact.name} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-full">
                    <contact.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-foreground">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCall(contact.number, contact.name)}
                  className={`${contact.color} text-white w-20 h-20 rounded-full text-lg font-bold`}
                >
                  <div className="text-center">
                    <Phone className="w-6 h-6 mb-1 mx-auto" />
                    <div>{contact.number}</div>
                  </div>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 text-sm font-medium">
            ⚠️ השתמש במוקדים אלה רק במקרי חירום אמיתיים
          </p>
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

export default EmergencyContactsPage;