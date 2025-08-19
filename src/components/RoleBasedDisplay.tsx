import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { AppRole, FamilyScope } from '@/types/family';

interface RoleBasedDisplayProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredScope?: FamilyScope;
  fallback?: React.ReactNode;
}

/**
 * Component for conditionally displaying content based on user role and scopes
 */
const RoleBasedDisplay = ({ 
  children, 
  allowedRoles, 
  requiredScope, 
  fallback = null 
}: RoleBasedDisplayProps) => {
  const { authState } = useAuth();

  // Check if user is authenticated
  if (!authState.isAuthenticated || !authState.role) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (allowedRoles && !allowedRoles.includes(authState.role)) {
    return <>{fallback}</>;
  }

  // Check scope requirements for FAMILY users
  if (requiredScope && authState.role === 'FAMILY') {
    if (!authState.scopes?.includes(requiredScope)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleBasedDisplay;