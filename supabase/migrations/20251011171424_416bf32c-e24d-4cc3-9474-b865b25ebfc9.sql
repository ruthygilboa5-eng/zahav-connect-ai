-- 1) Allow multiple permission requests per feature per family pair
-- Drop old unique constraint on (primary_user_id, family_member_id)
ALTER TABLE public.permissions_requests
  DROP CONSTRAINT IF EXISTS permissions_requests_primary_user_id_family_member_id_key;

-- Ensure permission_type is not null for uniqueness and data integrity
UPDATE public.permissions_requests
SET permission_type = COALESCE(permission_type, 'join')
WHERE permission_type IS NULL;

ALTER TABLE public.permissions_requests
  ALTER COLUMN permission_type SET NOT NULL;

-- Add new unique constraint including permission_type
ALTER TABLE public.permissions_requests
  ADD CONSTRAINT permissions_requests_unique_triple
  UNIQUE (primary_user_id, family_member_id, permission_type);

-- 2) Helper function to expose owner's display name to a family member
-- This safely bypasses RLS via SECURITY DEFINER and only returns the
-- name for the owner that the current auth user is linked to in family_links
CREATE OR REPLACE FUNCTION public.get_owner_display_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(up.display_name, up.first_name, 'המשתמש הראשי')
  FROM public.user_profiles up
  JOIN public.family_links fl
    ON fl.owner_user_id = up.user_id
  WHERE fl.member_user_id = auth.uid()
  LIMIT 1;
$$;