-- Add 'admin' to the app_role enum
ALTER TYPE app_role ADD VALUE 'admin';

-- Insert the primary admin user
-- Note: Replace 'your@email.com' with the actual admin email
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'your@email.com'
ON CONFLICT (user_id, role) DO NOTHING;