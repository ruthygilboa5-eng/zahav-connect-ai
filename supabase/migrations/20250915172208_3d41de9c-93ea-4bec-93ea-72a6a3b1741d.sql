-- Ensure updated_at auto update trigger on permissions_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_permissions_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_permissions_requests_updated_at
    BEFORE UPDATE ON public.permissions_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create sync triggers between permissions_requests and family_members_permissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_permissions_requests_sync_ai'
  ) THEN
    CREATE TRIGGER trg_permissions_requests_sync_ai
    AFTER INSERT ON public.permissions_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_permissions_requests_to_family_permissions();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_permissions_requests_sync_au'
  ) THEN
    CREATE TRIGGER trg_permissions_requests_sync_au
    AFTER UPDATE ON public.permissions_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_permissions_requests_to_family_permissions();
  END IF;
END $$;

-- Helpful index for primary_user_id lookups
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_id 
  ON public.permissions_requests(primary_user_id);
