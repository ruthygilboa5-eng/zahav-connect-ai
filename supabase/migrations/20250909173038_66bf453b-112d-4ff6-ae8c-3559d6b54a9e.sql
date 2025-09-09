-- Update admin user email to ruthygilboa5@gmail.com
-- Remove any existing admin role assignments first to avoid duplicates
DELETE FROM public.user_roles WHERE role = 'admin'::app_role;

-- Insert the admin role for the correct user
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'ruthygilboa5@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;