import { USE_PREVIEW_MAIN_USER } from '@/config/preview';

const PreviewBanner = () => {
  if (!USE_PREVIEW_MAIN_USER) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
      <p className="text-sm text-primary font-medium">
        מצב תצוגה – משתמש ראשי (ללא התחברות)
      </p>
    </div>
  );
};

export default PreviewBanner;