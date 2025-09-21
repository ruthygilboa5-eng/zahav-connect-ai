-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- Create more secure and explicit RLS policies for user_profiles
-- Only authenticated users can access their own profile
CREATE POLICY "Authenticated users can view only their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Only authenticated users can insert their own profile
CREATE POLICY "Authenticated users can insert only their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Only authenticated users can update their own profile
CREATE POLICY "Authenticated users can update only their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
) 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Only authenticated users can delete their own profile
CREATE POLICY "Authenticated users can delete only their own profile" 
ON public.user_profiles 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Add admin policy for user management if needed
CREATE POLICY "Admins can view all profiles for management" 
ON public.user_profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update profiles for management" 
ON public.user_profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
) 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);