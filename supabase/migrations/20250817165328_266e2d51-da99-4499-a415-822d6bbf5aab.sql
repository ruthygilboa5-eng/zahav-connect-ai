-- Fix security vulnerability: Restrict user_profiles access to profile owners only
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.user_profiles;

-- Allow users to view only their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to insert only their own profile
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete only their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
USING (user_id = auth.uid());