-- Find and delete all data for user with email ruthygilboa5@gmail.com

-- First, find the user_id for this email
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user_id from auth.users table
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'ruthygilboa5@gmail.com';
    
    -- If user exists, delete all related data
    IF target_user_id IS NOT NULL THEN
        -- Delete from emergency_consents (via contacts relationship)
        DELETE FROM public.emergency_consents 
        WHERE contact_id IN (
            SELECT id FROM public.contacts 
            WHERE owner_user_id = target_user_id
        );
        
        -- Delete contacts
        DELETE FROM public.contacts 
        WHERE owner_user_id = target_user_id;
        
        -- Delete family permission requests
        DELETE FROM public.family_permission_requests 
        WHERE owner_user_id = target_user_id;
        
        -- Delete family links (both as owner and member)
        DELETE FROM public.family_links 
        WHERE owner_user_id = target_user_id OR member_user_id = target_user_id;
        
        -- Delete memories
        DELETE FROM public.memories 
        WHERE owner_user_id = target_user_id;
        
        -- Delete pending queue items
        DELETE FROM public.pending_queue 
        WHERE owner_user_id = target_user_id;
        
        -- Delete permission requests (both as primary user and family member)
        DELETE FROM public.permissions_requests 
        WHERE primary_user_id = target_user_id OR family_member_id = target_user_id;
        
        -- Delete reminders
        DELETE FROM public.reminders 
        WHERE owner_user_id = target_user_id;
        
        -- Delete user roles
        DELETE FROM public.user_roles 
        WHERE user_id = target_user_id;
        
        -- Delete user profile
        DELETE FROM public.user_profiles 
        WHERE user_id = target_user_id;
        
        -- Finally, delete the user from auth.users
        DELETE FROM auth.users 
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully deleted user % and all related data', 'ruthygilboa5@gmail.com';
    ELSE
        RAISE NOTICE 'User with email % not found', 'ruthygilboa5@gmail.com';
    END IF;
END $$;