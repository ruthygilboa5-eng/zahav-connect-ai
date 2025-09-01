import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook that provides a function to navigate to the correct home page based on user role
 * MAIN_USER -> /dashboard
 * FAMILY -> /family
 */
export function useGoHome() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  return () => {
    const targetPath = authState.role === 'MAIN_USER' ? '/dashboard' : '/family';
    navigate(targetPath, { replace: true });
  };
}