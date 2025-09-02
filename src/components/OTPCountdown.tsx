import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getRemainingTime } from '@/config/otp';

interface OTPCountdownProps {
  sentAt: number;
  onResend: () => void;
  loading?: boolean;
}

export const OTPCountdown = ({ sentAt, onResend, loading }: OTPCountdownProps) => {
  const [remainingTime, setRemainingTime] = useState(getRemainingTime(sentAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemainingTime = getRemainingTime(sentAt);
      setRemainingTime(newRemainingTime);
      
      if (newRemainingTime <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sentAt]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center space-y-4">
      {remainingTime > 0 ? (
        <div className="text-sm text-muted-foreground">
          <p>הקוד תקף עוד:</p>
          <p className="text-lg font-mono text-primary">{formatTime(remainingTime)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-destructive">הקוד פג תוקף</p>
          <Button 
            variant="outline" 
            onClick={onResend}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'שולח...' : 'שלח קוד חדש'}
          </Button>
        </div>
      )}
    </div>
  );
};