import React, { useEffect } from 'react';
import ElderlyInterface from '@/components/ElderlyInterface';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/providers/AuthProvider';

const HomePage = () => {
  const { authState } = useAuth();
  useEffect(() => {
    console.log('HomePage rendering, authState:', authState);
  }, [authState]);
  return (
    <AppLayout>
      <ElderlyInterface />
    </AppLayout>
  );
};

export default HomePage;