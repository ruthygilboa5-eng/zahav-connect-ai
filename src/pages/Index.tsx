import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import FamilyDashboard from '@/components/FamilyDashboard';
import NavigationHeader from '@/components/NavigationHeader';
import SettingsModal from '@/components/SettingsModal';

const Index = () => {
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    userName: 'אבא',
    children: [],
    grandchildren: [],
    institutionalContacts: []
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      {currentView === 'elderly' ? (
        <ElderlyInterface userName={settings.userName} />
      ) : (
        <FamilyDashboard />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
};

export default Index;
