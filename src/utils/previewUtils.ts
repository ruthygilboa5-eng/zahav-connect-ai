import { USE_PREVIEW_MAIN_USER } from '@/config/preview';
import { toast } from 'sonner';

// Show toast for features that are stubbed in preview mode
export const showPreviewStubToast = (featureName: string = '') => {
  if (USE_PREVIEW_MAIN_USER) {
    toast.info(`${featureName ? featureName + ' - ' : ''}זמין רק במצב אמיתי`, {
      description: 'תכונה זו תעבוד רק עם חיבור לשרת אמיתי',
      duration: 3000
    });
    return true;
  }
  return false;
};

// Check if we should stub a feature
export const shouldStubFeature = () => USE_PREVIEW_MAIN_USER;