-- Fix RLS policies for family_links table
-- This will allow family members to read their own links and main users to read their family links

-- Drop existing policies
DROP POLICY IF EXISTS "Allow new family member registration" ON public.family_links;
DROP POLICY IF EXISTS "Family members can update their own family link" ON public.family_links;
DROP POLICY IF EXISTS "Owners by email can update family links" ON public.family_links;
DROP POLICY IF EXISTS "Owners can delete their family links" ON public.family_links;
DROP POLICY IF EXISTS "Owners can update their family links" ON public.family_links;
DROP POLICY IF EXISTS "Owners can view family links by email" ON public.family_links;
DROP POLICY IF EXISTS "Owners can view their family links" ON public.family_links;
DROP POLICY IF EXISTS "Secure family link viewing" ON public.family_links;

-- Create new simplified policies

-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can register as family member"
ON public.family_links
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow family members to SELECT their own links
CREATE POLICY "Family members can view their own links"
ON public.family_links
FOR SELECT
TO authenticated
USING (member_user_id = auth.uid());

-- Allow main users to SELECT their family links
CREATE POLICY "Main users can view their family links"
ON public.family_links
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

-- Allow main users to UPDATE their family links
CREATE POLICY "Main users can update their family links"
ON public.family_links
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- Allow family members to UPDATE their own profile info
CREATE POLICY "Family members can update their own info"
ON public.family_links
FOR UPDATE
TO authenticated
USING (member_user_id = auth.uid())
WITH CHECK (member_user_id = auth.uid());

-- Allow main users to DELETE their family links
CREATE POLICY "Main users can delete their family links"
ON public.family_links
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());