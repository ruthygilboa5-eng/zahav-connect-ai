-- Add policy to allow owners by email to update family_links (to claim/approve before owner_user_id is set)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'family_links' 
      AND policyname = 'Owners by email can update family links'
  ) THEN
    CREATE POLICY "Owners by email can update family links"
    ON public.family_links
    FOR UPDATE
    USING (lower(owner_email) = lower(public.get_current_user_email()))
    WITH CHECK (true);
  END IF;
END $$;

-- Allow family members to create permission requests for their own link
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'family_permission_requests' 
      AND policyname = 'Family members can create permission requests for their own link'
  ) THEN
    CREATE POLICY "Family members can create permission requests for their own link"
    ON public.family_permission_requests
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.family_links fl
        WHERE fl.id = family_permission_requests.family_link_id
          AND fl.member_user_id = auth.uid()
          AND family_permission_requests.owner_user_id = fl.owner_user_id
      )
    );
  END IF;
END $$;