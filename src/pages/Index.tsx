import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import FamilyDashboard from '@/components/FamilyDashboard';
import NavigationHeader from '@/components/NavigationHeader';

const Index = () => {
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      {currentView === 'elderly' ? (
        <ElderlyInterface userName="אבא" />
      ) : (
        <FamilyDashboard />
      )}
    </div>
  );
};

export default Index;
