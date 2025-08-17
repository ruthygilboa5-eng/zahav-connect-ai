import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import NavigationHeader from '@/components/NavigationHeader';
import NewSettingsModal from '@/components/NewSettingsModal';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onSignOut={signOut}
        user={user}
      />
      
      <ElderlyInterface />

      <NewSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Index;
