-- Fix security issues with user_profiles and contacts tables
-- Ensure proper RLS policies are in place to prevent unauthorized access to personal data

-- 1. Ensure RLS is enabled on sensitive tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can view only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles for management" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles for management" ON public.user_profiles;

-- 3. Create strict RLS policies for user_profiles
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile only"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile only"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile only"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete their own profile only"
ON public.user_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles (for management purposes)
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update profiles (for management purposes)
CREATE POLICY "Admins can update profiles"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Ensure contacts table policies are secure
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Create strict policies for contacts
CREATE POLICY "Users can view their own contacts only"
ON public.contacts FOR SELECT
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own contacts only"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own contacts only"
ON public.contacts FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own contacts only"
ON public.contacts FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);

-- 5. Revoke any public access to these tables
REVOKE ALL ON public.user_profiles FROM PUBLIC;
REVOKE ALL ON public.contacts FROM PUBLIC;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.contacts FROM anon;

-- 6. Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;