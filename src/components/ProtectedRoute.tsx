import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'main_user' | 'family_basic' | 'family_emergency';
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requireRole, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireRole && userRole !== requireRole) {
    // Redirect based on user role
    if (userRole === 'main_user') {
      return <Navigate to="/" replace />;
    } else if (userRole === 'family_basic' || userRole === 'family_emergency') {
      return <Navigate to="/family-dashboard" replace />;
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;