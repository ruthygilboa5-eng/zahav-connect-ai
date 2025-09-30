-- Apply same security model to main user view for consistency
-- Revoke direct access to ensure access only through the security definer function
REVOKE ALL ON public.v_permission_requests_main_user FROM anon, authenticated;

-- Grant execute permission on the safe function
GRANT EXECUTE ON FUNCTION public.get_permission_requests_main_user() TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.v_permission_requests_main_user 
IS 'SECURITY: Contains PII (names, emails). Access restricted - must use get_permission_requests_main_user() function which enforces ownership checks. Direct SELECT blocked for security.';

COMMENT ON FUNCTION public.get_permission_requests_main_user()
IS 'SECURITY DEFINER function that returns permission requests with user PII filtered by primary_user_id. This is the ONLY safe way to access v_permission_requests_main_user view.';