-- Update existing user to admin role
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = '3866825a-4d02-44c8-8993-b52ce344a34c';

-- Update the handle_new_user function to not override admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''));
  
  -- Only assign default primary_user role if no role exists yet
  -- This prevents overriding admin roles that might be set during signup
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    -- Check if this is an admin signup (indicated by metadata)
    IF NEW.raw_user_meta_data ->> 'is_admin' = 'true' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin');
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'primary_user');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;