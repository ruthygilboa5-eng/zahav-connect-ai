// Developer Mode Configuration
export const DEV_MODE_DEMO = true; // Set to true to enable Demo Mode (no Supabase auth required)
export const USE_MOCK_DATA = false; // production
export const ENABLE_REAL_UPLOADS = true; // use Supabase Storage
export const ALLOW_DEMO_DEFAULTS = true; // allow demo fallbacks
export const SHOW_ADMIN_BANNER = true; // show admin banner for missing tables

export const DEMO_USER = {
  id: "demo-user",
  role: "MAIN_USER" as const,
  firstName: "",
  lastName: "", 
  email: "demo@example.com"
};