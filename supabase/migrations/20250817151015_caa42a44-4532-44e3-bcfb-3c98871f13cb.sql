-- Temporarily modify RLS policies to allow unauthenticated access for development

-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create more permissive policies for development
CREATE POLICY "Allow all operations on user_profiles" 
ON public.user_profiles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Drop existing policies for contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Create more permissive policies for contacts
CREATE POLICY "Allow all operations on contacts" 
ON public.contacts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Drop existing policies for emergency_consents
DROP POLICY IF EXISTS "Users can view consents for their contacts" ON public.emergency_consents;
DROP POLICY IF EXISTS "Users can create consents for their contacts" ON public.emergency_consents;
DROP POLICY IF EXISTS "Users can update consents for their contacts" ON public.emergency_consents;

-- Create more permissive policies for emergency_consents
CREATE POLICY "Allow all operations on emergency_consents" 
ON public.emergency_consents 
FOR ALL 
USING (true)
WITH CHECK (true);