-- Fix security vulnerability by implementing proper user-based RLS policies

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow all operations on emergency_consents" ON public.emergency_consents;

-- Create secure user-based policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (user_id::text = current_setting('app.current_user_id', true))
WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

-- Create secure user-based policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (owner_user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (owner_user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (owner_user_id::text = current_setting('app.current_user_id', true))
WITH CHECK (owner_user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (owner_user_id::text = current_setting('app.current_user_id', true));

-- Create secure policies for emergency_consents (users can manage consents for their own contacts)
CREATE POLICY "Users can view consents for their contacts" 
ON public.emergency_consents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id::text = current_setting('app.current_user_id', true)
  )
);

CREATE POLICY "Users can create consents for their contacts" 
ON public.emergency_consents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id::text = current_setting('app.current_user_id', true)
  )
);

CREATE POLICY "Users can update consents for their contacts" 
ON public.emergency_consents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id::text = current_setting('app.current_user_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id::text = current_setting('app.current_user_id', true)
  )
);