-- Add admin role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create admin dashboard views with aggregated data
CREATE OR REPLACE VIEW public.admin_users_summary AS
SELECT 
  up.user_id,
  up.first_name,
  up.last_name,
  up.display_name,
  up.email,
  up.created_at as registration_date,
  ur.role,
  (
    SELECT COUNT(*) 
    FROM public.family_links fl 
    WHERE fl.owner_user_id = up.user_id AND fl.status = 'APPROVED'
  ) as family_members_count,
  (
    SELECT COUNT(*) 
    FROM public.family_links fl 
    WHERE fl.owner_user_id = up.user_id AND fl.status = 'PENDING'
  ) as pending_requests_count
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON ur.user_id = up.user_id
WHERE ur.role = 'primary_user';

-- Create view for family members details
CREATE OR REPLACE VIEW public.admin_family_members AS
SELECT 
  fl.id,
  fl.full_name,
  fl.email,
  fl.phone,
  fl.relationship_to_primary_user as relationship,
  fl.status,
  fl.created_at,
  fl.updated_at,
  fl.owner_user_id,
  up.first_name as owner_first_name,
  up.last_name as owner_last_name,
  up.email as owner_email
FROM public.family_links fl
LEFT JOIN public.user_profiles up ON up.user_id = fl.owner_user_id;

-- Create view for pending requests summary
CREATE OR REPLACE VIEW public.admin_pending_requests AS
SELECT 
  fl.id,
  fl.full_name,
  fl.email,
  fl.phone,
  fl.relationship_to_primary_user as relationship,
  fl.created_at,
  up.first_name as owner_first_name,
  up.last_name as owner_last_name,
  up.email as owner_email,
  fl.owner_user_id
FROM public.family_links fl
LEFT JOIN public.user_profiles up ON up.user_id = fl.owner_user_id
WHERE fl.status = 'PENDING';

-- Add RLS policies for admin views
CREATE POLICY "Admins can view users summary" ON public.user_profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all family links" ON public.family_links
FOR SELECT TO authenticated  
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update family link status" ON public.family_links
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));