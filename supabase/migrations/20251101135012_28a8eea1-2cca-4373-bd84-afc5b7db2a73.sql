-- יצירת דוח מצב הטריגרים לבדיקה
SELECT 
  'Trigger Status Check' as check_type,
  jsonb_build_object(
    'on_auth_user_created', (
      SELECT tgenabled = 'O' 
      FROM pg_trigger 
      WHERE tgrelid = 'auth.users'::regclass 
        AND tgname = 'on_auth_user_created'
    ),
    'on_auth_user_email_confirmed', (
      SELECT tgenabled = 'O' 
      FROM pg_trigger 
      WHERE tgrelid = 'auth.users'::regclass 
        AND tgname = 'on_auth_user_email_confirmed'
    )
  ) as status;

-- תיקון הטריגר handle_user_email_confirmed - הוספת logging ותיקון התנאי
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
  v_user_role text;
BEGIN
  -- רק על עדכון email_confirmed_at מ-NULL לערך
  IF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- קבל את ה-role של המשתמש
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = NEW.id
    LIMIT 1;
    
    -- רק עבור בני משפחה
    IF v_user_role = 'family_member' THEN
      
      -- חפש family_link קיים
      SELECT id, owner_user_id INTO v_link_id, v_owner_user_id
      FROM public.family_links
      WHERE member_user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1;

      -- אם אין link, צור אחד חדש מהמטא-דאטה
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

      -- עבד על ה-scopes מהמטא-דאטה
      v_scopes := COALESCE(
        CASE WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_scopes') = 'array' 
             THEN NEW.raw_user_meta_data -> 'selected_scopes' 
        END,
        to_jsonb(string_to_array(COALESCE(NEW.raw_user_meta_data ->> 'selected_scopes', ''), ','))
      );

      -- צור בקשות הרשאות
      IF v_link_id IS NOT NULL AND v_owner_user_id IS NOT NULL AND v_scopes IS NOT NULL THEN
        FOR v_scope IN SELECT jsonb_array_elements_text(v_scopes)
        LOOP
          -- הכנס בקשת הרשאה אם לא קיימת
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