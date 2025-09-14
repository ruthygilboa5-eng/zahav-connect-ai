-- Update family_members table structure
-- Rename owner_user_id to main_user_id for clarity
ALTER TABLE public.family_members 
RENAME COLUMN owner_user_id TO main_user_id;

-- Add index for better performance on main_user_id lookups
CREATE INDEX IF NOT EXISTS idx_family_members_main_user_id 
ON public.family_members(main_user_id);

-- Ensure family_members_permissions can be linked through family_members
-- Add main_user_id column to family_members_permissions for easier queries
ALTER TABLE public.family_members_permissions
ADD COLUMN IF NOT EXISTS main_user_id UUID;

-- Update existing family_members_permissions with main_user_id from family_links
UPDATE public.family_members_permissions 
SET main_user_id = fl.owner_user_id
FROM public.family_links fl
WHERE family_members_permissions.family_member_id = fl.id
AND family_members_permissions.main_user_id IS NULL;

-- Create function to automatically set main_user_id in permissions
CREATE OR REPLACE FUNCTION public.set_permission_main_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get main_user_id from family_links when inserting permission
  SELECT fl.owner_user_id INTO NEW.main_user_id
  FROM public.family_links fl
  WHERE fl.id = NEW.family_member_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate main_user_id
DROP TRIGGER IF EXISTS set_permission_main_user_trigger ON public.family_members_permissions;
CREATE TRIGGER set_permission_main_user_trigger
  BEFORE INSERT ON public.family_members_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_permission_main_user_id();

-- Update RLS policies for family_members_permissions to include main_user_id check
DROP POLICY IF EXISTS "Main users can view permission requests for their family members v2" ON public.family_members_permissions;
CREATE POLICY "Main users can view permission requests for their family members v2"
ON public.family_members_permissions
FOR SELECT
USING (main_user_id = auth.uid());

DROP POLICY IF EXISTS "Main users can update permission requests for their family members v2" ON public.family_members_permissions;  
CREATE POLICY "Main users can update permission requests for their family members v2"
ON public.family_members_permissions
FOR UPDATE  
USING (main_user_id = auth.uid());

-- Add helpful comments
COMMENT ON COLUMN public.family_members.main_user_id IS 'Reference to the primary user (user_profiles.user_id) this family member belongs to';
COMMENT ON COLUMN public.family_members_permissions.main_user_id IS 'Denormalized reference to main user for faster queries';
COMMENT ON FUNCTION public.set_permission_main_user_id() IS 'Auto-populates main_user_id in family_members_permissions from family_links';