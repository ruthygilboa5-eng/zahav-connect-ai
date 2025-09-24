-- 1) Ensure views run with invoker rights (fix linter: Security Definer View)
ALTER VIEW IF EXISTS public.v_permission_requests_admin SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_permission_requests_main_user SET (security_invoker = true);

-- 2) Allow admins to read family_members so admin view can join member details without violating RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'family_members' 
      AND policyname = 'Admins can view all family members'
  ) THEN
    CREATE POLICY "Admins can view all family members"
    ON public.family_members
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
