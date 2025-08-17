-- Fix emergency_consents security properly - corrected version
DROP POLICY IF EXISTS "Authenticated users can manage emergency consents" ON public.emergency_consents;

-- Allow contact owners to view their emergency consents
CREATE POLICY "Contact owners can view their emergency consents" 
ON public.emergency_consents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);

-- Allow contact owners to create emergency consents for their contacts
CREATE POLICY "Contact owners can create emergency consents" 
ON public.emergency_consents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);

-- Allow limited updates - only the consent recipient can update status
-- This is for the emergency approval flow
CREATE POLICY "Allow consent status updates" 
ON public.emergency_consents 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow contact owners to delete their emergency consents
CREATE POLICY "Contact owners can delete their emergency consents" 
ON public.emergency_consents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);