-- Update get_user_id_by_email to search both profiles and auth.users (case-insensitive)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_address text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Try profiles first (case-insensitive)
  SELECT up.user_id INTO user_uuid
  FROM public.user_profiles up
  WHERE lower(up.email) = lower(email_address)
  LIMIT 1;

  -- Fallback to auth.users if not found
  IF user_uuid IS NULL THEN
    SELECT u.id INTO user_uuid
    FROM auth.users u
    WHERE lower(u.email) = lower(email_address)
    LIMIT 1;
  END IF;

  RETURN user_uuid;
END;
$$;

-- Update handle_new_user to set email and assign correct role based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'primary_user');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists to run handle_new_user on new signups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;