import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import FamilyDashboard from '@/components/FamilyDashboard';
import NavigationHeader from '@/components/NavigationHeader';
import NewSettingsModal from '@/components/NewSettingsModal';
import SignupWizard from '@/components/SignupWizard';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, loading } = useAuth();

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  // Show signup wizard if user is not authenticated
  if (!user) {
    return <SignupWizard onComplete={() => window.location.reload()} />;
  }

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
