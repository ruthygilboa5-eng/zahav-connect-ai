-- Fix the security warning by setting secure search_path for the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''));
  
  -- Assign default main_user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'main_user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;