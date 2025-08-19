import { useState } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import FamilyDashboard from '@/components/FamilyDashboard';
import NavigationHeader from '@/components/NavigationHeader';
import NewSettingsModal from '@/components/NewSettingsModal';
import SignupWizard from '@/components/SignupWizard';
import DevModeBanner from '@/components/DevModeBanner';
import { useDataProvider } from '@/providers/DataProvider';
import { DEV_MODE_DEMO } from '@/config/dev';

const Index = () => {
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, loading } = useDataProvider();

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
      <div className="relative z-10">
        <DevModeBanner />
        <NavigationHeader 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onSettingsClick={() => setIsSettingsOpen(true)}
          hideAuthButtons={DEV_MODE_DEMO}
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
    </div>
  );
};

export default Index;
