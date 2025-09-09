import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

type Role = 'MAIN_USER' | 'FAMILY' | 'ADMIN';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Allow landing page and admin paths for everyone
  if (location.pathname === '/' || location.pathname === '/admin-login' || location.pathname === '/admin-setup') {
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
    } else if (requiredRole === 'ADMIN') {
      toast({
        title: 'אין הרשאה',
        description: 'כניסה מותרת רק למנהלי המערכת',
        variant: 'destructive',
      });
    }
    
    // Redirect to appropriate route based on role
    const redirectPath = authState.role === 'ADMIN' ? '/admin-dashboard' :
                        authState.role === 'MAIN_USER' ? '/home' : 
                        '/family';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;