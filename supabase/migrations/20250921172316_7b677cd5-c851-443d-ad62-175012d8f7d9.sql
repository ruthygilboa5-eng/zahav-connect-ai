-- Fix Security Definer View issues by recreating views to avoid SECURITY DEFINER behavior

-- Drop existing views first
DROP VIEW IF EXISTS public.family_links_legacy;
DROP VIEW IF EXISTS public.v_permission_requests_admin;

-- Recreate family_links_legacy view with explicit SECURITY INVOKER (default)
CREATE VIEW public.family_links_legacy 
WITH (security_invoker = true) AS
SELECT 
    fm.id,
    fm.main_user_id AS owner_user_id,
    fm.user_id AS member_user_id,
    fm.full_name,
    fm.relationship_label AS relation,
    fm.phone,
    ''::text AS owner_phone,
    fm.status,
    ARRAY[]::text[] AS scopes,
    fm.email,
    up.email AS owner_email,
    fm.relationship_label AS relationship_to_primary_user,
    fm.gender,
    fm.created_at,
    fm.updated_at
FROM family_members fm
JOIN user_profiles up ON (up.user_id = fm.main_user_id);

-- Recreate v_permission_requests_admin view with explicit SECURITY INVOKER (default)
CREATE VIEW public.v_permission_requests_admin 
WITH (security_invoker = true) AS
SELECT 
    pr.id,
    pr.created_at,
    pr.updated_at,
    pr.status,
    pr.permission_type,
    fm.full_name AS family_member_name,
    fm.email AS family_member_email,
    up.full_name AS primary_user_name,
    up.email AS primary_user_email,
    pr.primary_user_id,
    pr.family_member_id
FROM permissions_requests pr
JOIN family_members fm ON (fm.id = pr.family_member_id)
JOIN user_profiles up ON (up.user_id = pr.primary_user_id)
ORDER BY pr.created_at DESC;