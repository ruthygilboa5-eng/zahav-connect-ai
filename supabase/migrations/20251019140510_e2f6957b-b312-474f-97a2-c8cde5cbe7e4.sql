-- Simplify handle_new_user to only create user_profiles and user_roles
-- Family_links and permissions will be created by handle_user_email_confirmed after email verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Upsert user profile with email
  INSERT INTO public.user_profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = now();

  -- Only assign a default role if none exists yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    IF NEW.raw_user_meta_data ->> 'is_admin' = 'true' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    ELSIF NEW.raw_user_meta_data ->> 'is_family' = 'true' THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'family_member');
      -- Family links will be created by handle_user_email_confirmed after verification
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'primary_user');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;