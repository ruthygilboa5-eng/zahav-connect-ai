-- Ensure trigger on auth.users to call public.handle_new_user
DO $$
BEGIN
  -- Drop existing trigger if it exists to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND c.relname = 'users'
      AND n.nspname = 'auth'
  ) THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;

  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
END$$;

-- Clean up orphan permission requests (no matching family_link)
DELETE FROM public.permissions_requests pr
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_links fl WHERE fl.id = pr.family_member_id
);

-- Clean up orphan family_members_permissions as well (defensive)
DELETE FROM public.family_members_permissions fmp
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_links fl WHERE fl.id = fmp.family_member_id
);

-- Add foreign key constraints to enforce integrity going forward
DO $$
BEGIN
  -- permissions_requests -> family_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'permissions_requests' 
      AND constraint_name = 'fk_permissions_requests_family_member'
  ) THEN
    ALTER TABLE public.permissions_requests
      ADD CONSTRAINT fk_permissions_requests_family_member
      FOREIGN KEY (family_member_id)
      REFERENCES public.family_links(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
  END IF;

  -- family_members_permissions -> family_links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'family_members_permissions' 
      AND constraint_name = 'fk_family_members_permissions_family_member'
  ) THEN
    ALTER TABLE public.family_members_permissions
      ADD CONSTRAINT fk_family_members_permissions_family_member
      FOREIGN KEY (family_member_id)
      REFERENCES public.family_links(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END$$;