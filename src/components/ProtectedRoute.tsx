import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

type Role = 'MAIN_USER' | 'FAMILY';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Allow landing page for everyone
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && authState.role !== requiredRole) {
    // Show toast for unauthorized access attempts
    if (requiredRole === 'MAIN_USER' && authState.role === 'FAMILY') {
      toast({
        title: 'אין הרשאה',
        description: 'כניסה מותרת רק למשתמש ראשי',
        variant: 'destructive',
      });
    }
    
    // Redirect to appropriate route based on role
    const redirectPath = authState.role === 'MAIN_USER' ? '/dashboard' : '/family';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;