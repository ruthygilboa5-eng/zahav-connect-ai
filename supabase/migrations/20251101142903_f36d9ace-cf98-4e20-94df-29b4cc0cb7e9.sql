-- Fix handle_user_email_confirmed to avoid status constraint issues and (re)create missing triggers

-- 1) Update function: use status 'PENDING' when creating family_links
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link_id uuid;
  v_owner_user_id uuid;
  v_scopes jsonb;
  v_scope text;
  v_user_role text;
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
      
      -- Try to find existing family_link
      SELECT id, owner_user_id INTO v_link_id, v_owner_user_id
      FROM public.family_links
      WHERE member_user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1;

      -- If not found, create from metadata
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
          'PENDING' -- Important: keep within allowed values
        RETURNING id, owner_user_id INTO v_link_id, v_owner_user_id;
      END IF;

      -- Parse scopes from metadata (array or comma-separated string)
      v_scopes := COALESCE(
        CASE WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_scopes') = 'array' 
             THEN NEW.raw_user_meta_data -> 'selected_scopes' 
        END,
        to_jsonb(NULLIF(NEW.raw_user_meta_data ->> 'selected_scopes', '')::text[]) -- fallback
      );

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
  -- Avoid breaking confirmation flow; log as NOTICE
  RAISE NOTICE 'handle_user_email_confirmed error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2) Create missing triggers safely (drop if exist first)
-- Trigger after user is created to set profile and role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger when email gets confirmed to create family_link and permission requests
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_user_email_confirmed();

-- 3) Keep family_members in sync with family_links inserts/updates
DROP TRIGGER IF EXISTS trg_family_links_sync ON public.family_links;
CREATE TRIGGER trg_family_links_sync
AFTER INSERT OR UPDATE ON public.family_links
FOR EACH ROW EXECUTE FUNCTION public.sync_family_links_to_members();