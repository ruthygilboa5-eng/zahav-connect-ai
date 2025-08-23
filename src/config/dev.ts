// Developer Mode Configuration
export const DEV_MODE_DEMO = true; // Set to false for Real Mode (Supabase Auth + DB)

export const DEMO_USER = {
  id: "demo-user",
  role: "MAIN_USER" as const,
  firstName: "אבא",
  lastName: "משתמש", 
  email: "demo@example.com"
};