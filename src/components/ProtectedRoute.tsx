import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

type Role = 'MAIN_USER' | 'FAMILY' | 'ADMIN';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authState, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  console.log('ProtectedRoute check', { path: location.pathname, requiredRole, isAuthenticated: authState.isAuthenticated, role: authState.role, loading });

  // Handle unauthorized access toasts in useEffect to avoid render-phase state updates
  useEffect(() => {
    if (requiredRole && authState.role !== requiredRole && authState.isAuthenticated) {
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
    }
  }, [requiredRole, authState.role, authState.isAuthenticated, toast]);

  // Allow landing page and admin paths for everyone
  if (location.pathname === '/' || location.pathname === '/admin-login' || location.pathname === '/admin-setup') {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If the user is authenticated but role hasn't been resolved yet, avoid redirect loops
  if (requiredRole && authState.isAuthenticated && authState.role === null) {
    return <div className="p-8 text-center">טוען הרשאות...</div>;
  }

  if (requiredRole && authState.role !== requiredRole) {
    // Redirect to appropriate route based on role
    const redirectPath = authState.role === 'ADMIN' ? '/admin-dashboard' :
                        authState.role === 'MAIN_USER' ? '/home' : 
                        '/family-real';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;