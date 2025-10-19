-- 1) Ensure trigger on auth.users to run handle_new_user after insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2) Create function to create permission requests after email confirmation
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_link_id uuid;
  v_owner_user_id uuid;
  v_scopes jsonb;
  v_scope text;
BEGIN
  -- Only proceed on first time email confirmation
  IF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at = NEW.email_confirmed_at) THEN
    -- Only for family members
    IF public.has_role(NEW.id, 'family_member') THEN
      -- Find family_link by member_user_id
      SELECT id, owner_user_id INTO v_link_id, v_owner_user_id
      FROM public.family_links
      WHERE member_user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1;

      -- If no link exists but we have owner_email in metadata, create it quickly
      IF v_link_id IS NULL THEN
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
        SELECT 
          public.get_user_id_by_email(COALESCE(NEW.raw_user_meta_data ->> 'owner_email', NEW.raw_user_meta_data ->> 'ownerEmail')),
          NEW.id,
          COALESCE(NEW.raw_user_meta_data ->> 'full_name', (NEW.raw_user_meta_data ->> 'first_name') || ' ' || (NEW.raw_user_meta_data ->> 'last_name')),
          COALESCE(NEW.raw_user_meta_data ->> 'relation', NEW.raw_user_meta_data ->> 'relationship_to_primary_user', ''),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'gender', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'relationship_to_primary_user', NEW.raw_user_meta_data ->> 'relation', ''),
          'ACTIVE'
        RETURNING id, owner_user_id INTO v_link_id, v_owner_user_id;
      END IF;

      -- Read selected scopes from metadata (accept array or JSON string)
      v_scopes := COALESCE(
        CASE WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_scopes') = 'array' THEN NEW.raw_user_meta_data -> 'selected_scopes' END,
        to_jsonb(string_to_array(COALESCE(NEW.raw_user_meta_data ->> 'selected_scopes', ''), ','))
      );

      IF v_link_id IS NOT NULL AND v_owner_user_id IS NOT NULL AND v_scopes IS NOT NULL THEN
        FOR v_scope IN SELECT jsonb_array_elements_text(v_scopes)
        LOOP
          -- Insert permission request if it doesn't already exist
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
END;
$$;

-- 3) Trigger after update on auth.users to detect email confirmation
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_email_confirmed'
  ) THEN
    CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();
  END IF;
END $$;