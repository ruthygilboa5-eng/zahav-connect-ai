-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Update the app_role enum to use primary_user and family_member
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('primary_user', 'family_member');

-- Update existing user_roles table to use new enum values
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING 
  CASE 
    WHEN role::text = 'main_user' THEN 'primary_user'::app_role
    WHEN role::text = 'family_basic' THEN 'family_member'::app_role
    ELSE 'primary_user'::app_role  -- default fallback
  END;

-- Recreate the functions with new enum values
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

-- Update the handle_new_user function to use primary_user as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''));
  
  -- Assign default primary_user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'primary_user');
  
  RETURN NEW;
END;
$function$;

-- Drop the old enum
DROP TYPE app_role_old;