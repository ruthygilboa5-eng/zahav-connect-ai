-- Revoke direct access to the admin view from all roles except service_role
-- This ensures the view can only be accessed through the security definer function
REVOKE ALL ON public.v_permission_requests_admin FROM anon, authenticated;

-- Grant execute permission on the safe function that checks admin role
GRANT EXECUTE ON FUNCTION public.get_permission_requests_admin() TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.v_permission_requests_admin 
IS 'SECURITY: Contains PII (names, emails). Access restricted - must use get_permission_requests_admin() function which enforces admin-only access. Direct SELECT blocked for security.';

COMMENT ON FUNCTION public.get_permission_requests_admin()
IS 'SECURITY DEFINER function that returns permission requests with user PII. Only accessible to admin users via has_role check. This is the ONLY safe way to access v_permission_requests_admin view.';