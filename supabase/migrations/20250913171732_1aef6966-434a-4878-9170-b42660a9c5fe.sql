-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create family links" ON public.family_links;

-- Allow anyone to create family links (needed for signup flow before email confirmation)
CREATE POLICY "Anyone can create family links"
ON public.family_links
FOR INSERT
TO public
WITH CHECK (true);