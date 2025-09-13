-- Allow anonymous users to create family link requests (needed for signup flow before email confirmation)
CREATE POLICY IF NOT EXISTS "Anyone can create family links"
ON public.family_links
FOR INSERT
TO public
WITH CHECK (true);
