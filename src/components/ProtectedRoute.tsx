import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { AppRole } from '@/types/family';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState } = useAuth();

  if (!authState.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && authState.role !== requiredRole) {
    // Redirect to appropriate route based on role
    const redirectPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;