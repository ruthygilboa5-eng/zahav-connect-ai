-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS trg_family_links_sync ON public.family_links;

-- Recreate handle_new_user function
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

-- Recreate handle_user_email_confirmed function with better logic
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
  v_owner_user_id uuid;
  v_scopes jsonb;
  v_scope text;
  v_user_role app_role;
  v_full_name text;
  v_relation text;
  v_owner_email text;
BEGIN
  -- Only when email_confirmed_at changes from NULL to a value
  IF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Get user's role
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = NEW.id
    LIMIT 1;
    
    -- Proceed only for family members
    IF v_user_role = 'family_member' THEN
      
      -- Get owner email from metadata
      v_owner_email := COALESCE(
        NEW.raw_user_meta_data ->> 'owner_email',
        NEW.raw_user_meta_data ->> 'ownerEmail'
      );
      
      -- Get owner user_id
      IF v_owner_email IS NOT NULL THEN
        SELECT user_id INTO v_owner_user_id
        FROM public.user_profiles
        WHERE lower(email) = lower(v_owner_email)
        LIMIT 1;
      END IF;

      -- Try to find existing family_link
      SELECT id INTO v_link_id
      FROM public.family_links
      WHERE member_user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1;

      -- If not found and we have owner, create from metadata
      IF v_link_id IS NULL AND v_owner_user_id IS NOT NULL THEN
        
        -- Build full name
        v_full_name := COALESCE(
          NEW.raw_user_meta_data ->> 'full_name',
          CONCAT(
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
          )
        );
        
        -- Get relation
        v_relation := COALESCE(
          NEW.raw_user_meta_data ->> 'relationship_to_primary_user',
          NEW.raw_user_meta_data ->> 'relation',
          ''
        );
        
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
        )
        VALUES (
          v_owner_user_id,
          NEW.id,
          v_full_name,
          v_relation,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'gender', ''),
          v_relation,
          'PENDING'
        )
        RETURNING id INTO v_link_id;
      END IF;

      -- Parse scopes from metadata
      IF NEW.raw_user_meta_data ? 'selected_scopes' THEN
        v_scopes := CASE 
          WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_scopes') = 'array' 
          THEN NEW.raw_user_meta_data -> 'selected_scopes'
          ELSE to_jsonb(string_to_array(NEW.raw_user_meta_data ->> 'selected_scopes', ','))
        END;
      END IF;

      -- Create permission requests for each scope
      IF v_link_id IS NOT NULL AND v_owner_user_id IS NOT NULL AND v_scopes IS NOT NULL THEN
        FOR v_scope IN SELECT jsonb_array_elements_text(v_scopes)
        LOOP
          INSERT INTO public.permissions_requests (
            primary_user_id,
            family_member_id,
            permission_type,
            status
          )
          SELECT v_owner_user_id, v_link_id, v_scope, 'PENDING'
          WHERE NOT EXISTS (
            SELECT 1 FROM public.permissions_requests
            WHERE family_member_id = v_link_id AND permission_type = v_scope
          );
        END LOOP;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'handle_user_email_confirmed error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger on auth.users for email confirmation
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Create trigger to sync family_links to family_members
CREATE TRIGGER trg_family_links_sync
  AFTER INSERT OR UPDATE ON public.family_links
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_family_links_to_members();