-- Secure permission request views by restricting direct access and exposing safe RPCs

-- 1) Ensure views run with caller privileges
ALTER VIEW IF EXISTS public.v_permission_requests_admin SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_permission_requests_main_user SET (security_invoker = true);

-- 2) Revoke direct access to the views from client roles
REVOKE ALL PRIVILEGES ON TABLE public.v_permission_requests_admin FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.v_permission_requests_main_user FROM PUBLIC, anon, authenticated;

-- 3) Create secure RPCs that enforce role/user scoping server-side
CREATE OR REPLACE FUNCTION public.get_permission_requests_admin()
RETURNS SETOF public.v_permission_requests_admin
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM public.v_permission_requests_admin v
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY v.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_permission_requests_main_user()
RETURNS SETOF public.v_permission_requests_main_user
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM public.v_permission_requests_main_user v
  WHERE v.primary_user_id = auth.uid()
  ORDER BY v.created_at DESC;
$$;

-- 4) Lock down RPC permissions to authenticated users only
REVOKE ALL ON FUNCTION public.get_permission_requests_admin FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_permission_requests_main_user FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_permission_requests_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_permission_requests_main_user TO authenticated;