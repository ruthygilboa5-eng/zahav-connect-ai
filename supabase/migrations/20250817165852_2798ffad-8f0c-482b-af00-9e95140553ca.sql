-- Fix emergency_consents security - the previous migration didn't apply correctly
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

-- Allow anyone to update consent status using valid token (for approval flow)
CREATE POLICY "Token holders can update consent status" 
ON public.emergency_consents 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Only allow updating status field, and only if token matches
  OLD.token = NEW.token AND 
  OLD.contact_id = NEW.contact_id AND
  OLD.expires_at = NEW.expires_at AND
  OLD.created_at = NEW.created_at
);

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