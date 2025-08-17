-- Fix security vulnerability: Replace overly permissive RLS policies with proper user-based access controls

-- Drop overly permissive policies for user_profiles
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;

-- Create secure policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Drop overly permissive policies for contacts
DROP POLICY IF EXISTS "Allow all operations on contacts" ON public.contacts;

-- Create secure policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Drop overly permissive policies for emergency_consents
DROP POLICY IF EXISTS "Allow all operations on emergency_consents" ON public.emergency_consents;

-- Create secure policies for emergency_consents
CREATE POLICY "Users can view consents for their contacts" 
ON public.emergency_consents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert consents for their contacts" 
ON public.emergency_consents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update consents for their contacts" 
ON public.emergency_consents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);