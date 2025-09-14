-- Fix security warnings by properly dropping and recreating functions
DROP TRIGGER IF EXISTS set_permission_main_user_trigger ON public.family_members_permissions;
DROP FUNCTION IF EXISTS public.set_permission_main_user_id() CASCADE;

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION public.set_permission_main_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get main_user_id from family_links when inserting permission
  SELECT fl.owner_user_id INTO NEW.main_user_id
  FROM public.family_links fl
  WHERE fl.id = NEW.family_member_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER set_permission_main_user_trigger
  BEFORE INSERT ON public.family_members_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_permission_main_user_id();