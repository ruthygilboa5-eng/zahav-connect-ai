-- Update handle_new_user trigger to automatically create family_links entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_user_id UUID;
  v_owner_email TEXT;
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
      
      -- Create family_links entry for family member
      v_owner_email := NEW.raw_user_meta_data ->> 'owner_email';
      
      IF v_owner_email IS NOT NULL AND v_owner_email != '' THEN
        -- Find owner user_id by email
        SELECT user_id INTO v_owner_user_id
        FROM public.user_profiles
        WHERE lower(email) = lower(v_owner_email)
        LIMIT 1;
        
        -- If owner found, create family_links entry
        IF v_owner_user_id IS NOT NULL THEN
          INSERT INTO public.family_links (
            owner_user_id,
            member_user_id,
            full_name,
            relation,
            email,
            phone,
            gender,
            relationship_to_primary_user,
            status
          ) VALUES (
            v_owner_user_id,
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'),
            COALESCE(NEW.raw_user_meta_data ->> 'relation', ''),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'gender', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'relationship_to_primary_user', NEW.raw_user_meta_data ->> 'relation', ''),
            'ACTIVE'
          );
        END IF;
      END IF;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'primary_user');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;