-- Find and fix any remaining security definer views
-- First, check if there are any other views that might be causing the issue

-- Ensure all existing views use security invoker
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Loop through all views in public schema and set security_invoker = true
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', view_record.table_name);
            RAISE NOTICE 'Set security_invoker=true for view: %', view_record.table_name;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not alter view %: %', view_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;