// Feature flag for preview mode - toggle this to switch between preview and real auth
export const USE_PREVIEW_MAIN_USER = true;

// Preview user data
export const PREVIEW_USER = {
  id: "preview-main-user",
  role: "main_user" as const,
  firstName: "אבא",
  lastName: "ישראל",
  phone: null
};