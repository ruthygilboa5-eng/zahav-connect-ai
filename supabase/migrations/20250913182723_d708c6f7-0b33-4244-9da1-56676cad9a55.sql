-- Add secure email-based visibility for family link requests
-- Helper function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  );
$$;

-- Policy: Owners can view links addressed to their email
CREATE POLICY "Owners can view family links by email"
ON public.family_links
FOR SELECT
USING (
  owner_email IS NOT NULL AND lower(owner_email) = lower(public.get_current_user_email())
);