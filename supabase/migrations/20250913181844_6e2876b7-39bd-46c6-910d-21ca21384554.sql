-- Fix security vulnerability: Properly secure family link creation
-- First check existing policies and recreate them securely

-- Drop all existing INSERT policies on family_links
DROP POLICY IF EXISTS "Authenticated users can create family link requests" ON public.family_links;
DROP POLICY IF EXISTS "Anyone can create family links" ON public.family_links;

-- Create secure policy for INSERT - only authenticated users can create family links
-- and they must be creating a link where they are the member (requester)
CREATE POLICY "Secure family link creation" 
ON public.family_links 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND member_user_id = auth.uid()
  AND member_user_id IS NOT NULL
);

-- Also update SELECT policy to be more secure
DROP POLICY IF EXISTS "Members can view their own links" ON public.family_links;
DROP POLICY IF EXISTS "Members can view their own family links" ON public.family_links;

-- Recreate secure SELECT policy
CREATE POLICY "Secure family link viewing" 
ON public.family_links 
FOR SELECT 
USING (
  (auth.uid() = member_user_id AND member_user_id IS NOT NULL)
  OR (auth.uid() = owner_user_id AND owner_user_id IS NOT NULL)
);