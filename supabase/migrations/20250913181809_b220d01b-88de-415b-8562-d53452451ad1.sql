-- Fix security vulnerability: Restrict family link creation to authenticated users only
-- and add proper validation

-- Drop the insecure policy that allows anyone to create family links
DROP POLICY IF EXISTS "Anyone can create family links" ON public.family_links;

-- Create secure policy that only allows authenticated users to create family links
-- and ensures they can only create links where they are the member (requester)
CREATE POLICY "Authenticated users can create family link requests" 
ON public.family_links 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND member_user_id = auth.uid()
);

-- Update the existing policy to ensure members can only see their own links
-- (keeping the existing "Members can view their own links" policy but making it more explicit)
DROP POLICY IF EXISTS "Members can view their own links" ON public.family_links;

CREATE POLICY "Members can view their own family links" 
ON public.family_links 
FOR SELECT 
USING (
  auth.uid() = member_user_id 
  OR auth.uid() = owner_user_id
);