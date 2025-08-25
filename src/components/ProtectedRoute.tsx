import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

type Role = 'MAIN_USER' | 'FAMILY';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const location = useLocation();

  // Allow landing page for everyone
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && authState.role !== requiredRole) {
    // Redirect to appropriate route based on role
    const redirectPath = authState.role === 'MAIN_USER' ? '/home' : '/family';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;