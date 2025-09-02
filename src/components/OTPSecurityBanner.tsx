import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { OTP_EXPIRY_SEC } from '@/config/otp';
import { useAuth } from '@/providers/AuthProvider';

export const OTPSecurityBanner = () => {
  const { authState } = useAuth();
  
  // Show only for MAIN_USER and only if OTP expiry is over 1 hour (3600 seconds)
  const shouldShowBanner = authState.role === 'MAIN_USER' && OTP_EXPIRY_SEC > 3600;
  
  if (!shouldShowBanner) return null;

  return (
    <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-right text-orange-800 dark:text-orange-200">
        <strong>אזהרת אבטחה:</strong> מומלץ לקצר את זמן תפוגת הקוד לפחות מ-60 דקות בהגדרות Supabase
      </AlertDescription>
    </Alert>
  );
};