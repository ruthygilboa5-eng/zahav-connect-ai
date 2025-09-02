// OTP Configuration
export const OTP_EXPIRY_SEC = 1800; // 30 דקות (לסנכרן עם ההגדרה ב-Supabase)
export const OTP_EXPIRY_MINUTES = Math.floor(OTP_EXPIRY_SEC / 60);

// Helper function to check if OTP is expired
export const isOTPExpired = (sentAt: number): boolean => {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - sentAt) / 1000);
  return elapsedSeconds >= OTP_EXPIRY_SEC;
};

// Helper function to get remaining time
export const getRemainingTime = (sentAt: number): number => {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - sentAt) / 1000);
  return Math.max(0, OTP_EXPIRY_SEC - elapsedSeconds);
};