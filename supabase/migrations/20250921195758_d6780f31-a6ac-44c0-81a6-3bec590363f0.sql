-- Recreate admin view with admin-only filter and add a separate main-user view
DROP VIEW IF EXISTS public.v_permission_requests_admin;
DROP VIEW IF EXISTS public.v_permission_requests_main_user;

-- Admin-only view (prevents non-admins from seeing any rows)
CREATE VIEW public.v_permission_requests_admin WITH (security_barrier=true) AS
SELECT 
  pr.id,
  pr.created_at,
  pr.updated_at,
  pr.primary_user_id,
  pr.family_member_id,
  pr.status,
  pr.permission_type,
  fm.full_name as family_member_name,
  fm.email as family_member_email,
  up.first_name || ' ' || up.last_name as primary_user_name,
  up.email as primary_user_email
FROM public.permissions_requests pr
LEFT JOIN public.family_members fm ON fm.id = pr.family_member_id
LEFT JOIN public.user_profiles up ON up.user_id = pr.primary_user_id
WHERE has_role(auth.uid(), 'admin'::app_role);

-- Main-user view (only shows the current primary user's own requests)
CREATE VIEW public.v_permission_requests_main_user WITH (security_barrier=true) AS
SELECT 
  pr.id,
  pr.created_at,
  pr.updated_at,
  pr.primary_user_id,
  pr.family_member_id,
  pr.status,
  pr.permission_type,
  fm.full_name as family_member_name,
  fm.email as family_member_email,
  up.first_name || ' ' || up.last_name as primary_user_name,
  up.email as primary_user_email
FROM public.permissions_requests pr
LEFT JOIN public.family_members fm ON fm.id = pr.family_member_id
LEFT JOIN public.user_profiles up ON up.user_id = pr.primary_user_id
WHERE pr.primary_user_id = auth.uid();