import React, { useState } from 'react';
import NavigationHeader from '@/components/NavigationHeader';
import NewSettingsModal from '@/components/NewSettingsModal';
import { useAuth } from '@/providers/AuthProvider';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { authState } = useAuth();
  const [currentView, setCurrentView] = useState<'elderly' | 'family'>('elderly');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      <div className="relative z-10">
        {authState.isAuthenticated && (
          <NavigationHeader 
            currentView={currentView} 
            onViewChange={setCurrentView}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        )}
        {children}
        
        {authState.isAuthenticated && (
          <NewSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;