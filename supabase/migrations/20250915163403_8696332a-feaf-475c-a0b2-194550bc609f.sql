-- 1) Add permission_type column to permissions_requests if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'permissions_requests' 
      AND column_name = 'permission_type'
  ) THEN
    ALTER TABLE public.permissions_requests
    ADD COLUMN permission_type text;
  END IF;
END $$;

-- 2) Ensure updated_at auto-updates on change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_permissions_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_permissions_requests_updated_at
    BEFORE UPDATE ON public.permissions_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Create sync function from permissions_requests -> family_members_permissions
CREATE OR REPLACE FUNCTION public.sync_permissions_requests_to_family_permissions()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update existing row if found
    UPDATE public.family_members_permissions fmp
      SET status = LOWER(NEW.status),
          main_user_id = NEW.primary_user_id,
          updated_at = now()
    WHERE fmp.family_member_id = NEW.family_member_id
      AND fmp.feature = NEW.permission_type;

    IF NOT FOUND THEN
      INSERT INTO public.family_members_permissions (
        family_member_id, main_user_id, feature, status
      ) VALUES (
        NEW.family_member_id, NEW.primary_user_id, NEW.permission_type, LOWER(NEW.status)
      );
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- First try to update by the old identifiers
    UPDATE public.family_members_permissions fmp
      SET status = LOWER(NEW.status),
          main_user_id = NEW.primary_user_id,
          feature = COALESCE(NEW.permission_type, fmp.feature),
          updated_at = now()
    WHERE fmp.family_member_id = COALESCE(OLD.family_member_id, NEW.family_member_id)
      AND fmp.feature = COALESCE(OLD.permission_type, NEW.permission_type);

    -- If no row was affected, try insert (covers rename of feature or first-time creation)
    IF NOT FOUND THEN
      INSERT INTO public.family_members_permissions (
        family_member_id, main_user_id, feature, status
      ) VALUES (
        COALESCE(NEW.family_member_id, OLD.family_member_id),
        NEW.primary_user_id,
        COALESCE(NEW.permission_type, OLD.permission_type),
        LOWER(NEW.status)
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4) Attach triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_permissions_requests_sync_ai'
  ) THEN
    CREATE TRIGGER trg_permissions_requests_sync_ai
    AFTER INSERT ON public.permissions_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_permissions_requests_to_family_permissions();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_permissions_requests_sync_au'
  ) THEN
    CREATE TRIGGER trg_permissions_requests_sync_au
    AFTER UPDATE ON public.permissions_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_permissions_requests_to_family_permissions();
  END IF;
END $$;

-- 5) RLS: allow admins to view and update all permission requests
DO $$
BEGIN
  -- SELECT policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Admins can view all permission requests' 
      AND polrelid = 'public.permissions_requests'::regclass
  ) THEN
    CREATE POLICY "Admins can view all permission requests"
    ON public.permissions_requests
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- UPDATE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Admins can update all permission requests' 
      AND polrelid = 'public.permissions_requests'::regclass
  ) THEN
    CREATE POLICY "Admins can update all permission requests"
    ON public.permissions_requests
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 6) Helpful index for main user queries
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_id
  ON public.permissions_requests (primary_user_id);
