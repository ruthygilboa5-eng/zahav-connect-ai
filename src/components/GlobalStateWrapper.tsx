import React from 'react';
import { useGlobalState } from '@/providers/GlobalStateProvider';
import LoadingScreen from '@/components/LoadingScreen';

interface GlobalStateWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows loading screen while global state is initializing
 */
const GlobalStateWrapper = ({ children }: GlobalStateWrapperProps) => {
  const { globalState } = useGlobalState();

  if (globalState.isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default GlobalStateWrapper;