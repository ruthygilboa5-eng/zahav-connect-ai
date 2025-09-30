-- Explicitly grant EXECUTE on the security functions
-- This ensures authenticated users CAN call these functions (the functions themselves check permissions)
GRANT EXECUTE ON FUNCTION public.get_permission_requests_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_permission_requests_main_user() TO authenticated;

-- For completeness, grant execute on other security functions too
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;

-- Document that these are the ONLY approved ways to access user PII
COMMENT ON FUNCTION public.get_permission_requests_admin() IS 
'SECURITY DEFINER: Returns permission requests with PII. Access checked via has_role(admin). This is the ONLY approved way to access admin permission view data.';

COMMENT ON FUNCTION public.get_permission_requests_main_user() IS 
'SECURITY DEFINER: Returns permission requests filtered by primary_user_id. This is the ONLY approved way to access main user permission view data.';