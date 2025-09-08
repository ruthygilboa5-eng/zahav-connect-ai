-- Update family_links table to include owner_email column for finding requests by main user email
ALTER TABLE public.family_links 
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Update existing records to use owner email from linked user profiles
UPDATE public.family_links 
SET owner_email = (
  SELECT up.email 
  FROM public.user_profiles up 
  WHERE up.user_id = family_links.owner_user_id
) 
WHERE owner_user_id IS NOT NULL AND owner_email IS NULL;

-- Add index for better performance when querying by owner_email
CREATE INDEX IF NOT EXISTS idx_family_links_owner_email 
ON public.family_links(owner_email);

-- Add index for better performance when querying by status
CREATE INDEX IF NOT EXISTS idx_family_links_status 
ON public.family_links(status);