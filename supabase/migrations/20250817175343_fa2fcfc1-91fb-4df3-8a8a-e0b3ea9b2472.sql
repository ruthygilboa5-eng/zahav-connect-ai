-- Fix RLS policies to work with temporary auth system
-- Since this is a demo app, we'll allow access without requiring full Supabase auth

-- Drop existing restrictive policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- Create permissive policies for user_profiles (demo app)
CREATE POLICY "Allow all operations on user_profiles" 
ON public.user_profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Drop existing restrictive policies for contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Create permissive policies for contacts (demo app)
CREATE POLICY "Allow all operations on contacts" 
ON public.contacts 
FOR ALL 
USING (true) 
WITH CHECK (true);