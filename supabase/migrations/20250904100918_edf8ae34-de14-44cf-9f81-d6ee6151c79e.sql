-- Add email field to family_links table for user identification
ALTER TABLE public.family_links ADD COLUMN email text;

-- Add index for better performance when searching by email
CREATE INDEX idx_family_links_email ON public.family_links(email);