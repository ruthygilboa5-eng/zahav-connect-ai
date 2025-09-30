-- Step 1: Explicitly deny access again (in case defaults reapplied)
REVOKE ALL ON public.v_permission_requests_admin FROM anon, authenticated, public;
REVOKE ALL ON public.v_permission_requests_main_user FROM anon, authenticated, public;

-- Step 2: Remove default privileges that auto-grant access to new views
-- This prevents future views from being automatically public
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
REVOKE SELECT ON TABLES FROM anon, authenticated;

-- Step 3: Verify by granting back only what's needed for normal tables
-- (You can selectively grant on specific tables that should be public)

-- Step 4: Document the security model
COMMENT ON SCHEMA public IS 
'SECURITY: Default privileges removed for views. All views containing PII must use SECURITY DEFINER functions for access control. Direct view access is blocked by default.';

-- Step 5: Ensure service_role can still access everything (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;