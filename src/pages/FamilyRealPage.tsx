import React from 'react';
import FamilyRealDashboard from '@/components/FamilyRealDashboard';
import MainUserDashboard from '@/components/MainUserDashboard';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/providers/AuthProvider';

const FamilyRealPage = () => {
  const { authState } = useAuth();
  const isMainUser = authState.role === 'MAIN_USER';

  return (
    <AppLayout>
      {isMainUser ? <MainUserDashboard /> : <FamilyRealDashboard />}
    </AppLayout>
  );
};

export default FamilyRealPage;
