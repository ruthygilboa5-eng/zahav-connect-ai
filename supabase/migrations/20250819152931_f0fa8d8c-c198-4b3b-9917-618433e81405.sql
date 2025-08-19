-- Add display_name column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN display_name TEXT;

-- Create RPC function to initialize account with profile and contacts
CREATE OR REPLACE FUNCTION public.init_account_with_profile_and_contacts(
  p_first_name TEXT,
  p_last_name TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_contacts JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_contact JSONB;
  v_contact_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Set default display_name if not provided
  IF p_display_name IS NULL OR p_display_name = '' THEN
    p_display_name := p_first_name;
  END IF;

  -- Update or insert user profile
  INSERT INTO public.user_profiles (user_id, first_name, last_name, display_name)
  VALUES (v_user_id, p_first_name, p_last_name, p_display_name)
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    updated_at = now()
  RETURNING id INTO v_profile_id;

  -- Process contacts if provided
  IF jsonb_array_length(p_contacts) > 0 THEN
    FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts)
    LOOP
      INSERT INTO public.contacts (
        owner_user_id,
        full_name,
        relation,
        phone,
        is_emergency_candidate,
        emergency_status
      )
      VALUES (
        v_user_id,
        v_contact->>'full_name',
        v_contact->>'relation',
        v_contact->>'phone',
        COALESCE((v_contact->>'is_emergency_candidate')::boolean, false),
        CASE 
          WHEN COALESCE((v_contact->>'is_emergency_candidate')::boolean, false) = true 
          THEN 'PENDING'::text 
          ELSE 'NONE'::text 
        END
      )
      RETURNING id INTO v_contact_id;
    END LOOP;
  END IF;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'user_id', v_user_id,
    'message', 'Account initialized successfully'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;