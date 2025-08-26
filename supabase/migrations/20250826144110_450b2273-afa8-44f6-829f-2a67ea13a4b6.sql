-- Add owner_phone column to family_links table for phone-based family linking
ALTER TABLE public.family_links 
ADD COLUMN owner_phone text;

-- Add index for faster phone number lookups
CREATE INDEX idx_family_links_owner_phone ON public.family_links(owner_phone) WHERE owner_phone IS NOT NULL;