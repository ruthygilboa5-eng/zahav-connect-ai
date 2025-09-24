-- Fix Security Definer View issue by removing security_barrier property
DROP VIEW IF EXISTS public.v_permission_requests_admin;
DROP VIEW IF EXISTS public.v_permission_requests_main_user;

-- Admin-only view (relies on underlying RLS policies for security)
CREATE VIEW public.v_permission_requests_admin AS
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

-- Main-user view (relies on underlying RLS policies for security)
CREATE VIEW public.v_permission_requests_main_user AS
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