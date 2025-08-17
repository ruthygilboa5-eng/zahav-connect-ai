-- Fix critical security vulnerability in emergency_consents table
-- Drop the insecure policy that allows anyone to update consent records
DROP POLICY IF EXISTS "Allow consent status updates" ON public.emergency_consents;

-- Create secure policy that only allows updates in specific circumstances:
-- 1. Contact owners can update their own consent records
-- 2. Updates to consent status when using valid tokens (for approval flow)
CREATE POLICY "Secure consent updates" 
ON public.emergency_consents 
FOR UPDATE 
USING (
  -- Allow contact owners to update their own consent records
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
  -- Note: Token-based updates will be handled via edge functions for better security
) 
WITH CHECK (
  -- Same check for the updated data
  EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE contacts.id = emergency_consents.contact_id 
    AND contacts.owner_user_id = auth.uid()
  )
);