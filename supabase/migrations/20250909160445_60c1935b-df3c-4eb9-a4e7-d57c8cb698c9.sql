-- Insert the primary admin user
-- Note: This will only work if the user already exists in auth.users
-- Replace 'your@email.com' with the actual admin email
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'your@email.com'
ON CONFLICT (user_id, role) DO NOTHING;