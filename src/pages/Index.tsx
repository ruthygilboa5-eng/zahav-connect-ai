import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import FamilyDashboard from '@/components/FamilyDashboard';
import NavigationHeader from '@/components/NavigationHeader';
import NewSettingsModal from '@/components/NewSettingsModal';

const Index = () => {
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      {currentView === 'elderly' ? (
        <ElderlyInterface />
      ) : (
        <FamilyDashboard />
      )}

      <NewSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Index;
