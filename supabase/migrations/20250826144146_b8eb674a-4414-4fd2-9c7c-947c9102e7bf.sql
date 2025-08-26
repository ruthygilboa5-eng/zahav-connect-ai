-- Create family_links table for managing family member connections
CREATE TABLE public.family_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relation text NOT NULL,
  phone text DEFAULT '',
  owner_phone text, -- Phone number of the main user for linking
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED')),
  scopes text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(owner_user_id, member_user_id), -- Prevent duplicate links
  CHECK (owner_user_id != member_user_id) -- Prevent self-linking
);

-- Enable RLS
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owners can view their family links" 
ON public.family_links 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their own links" 
ON public.family_links 
FOR SELECT 
USING (auth.uid() = member_user_id);

CREATE POLICY "Anyone can create family links" 
ON public.family_links 
FOR INSERT 
WITH CHECK (true); -- Allow creation, owner approval comes later

CREATE POLICY "Owners can update their family links" 
ON public.family_links 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their family links" 
ON public.family_links 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Add indexes for better performance
CREATE INDEX idx_family_links_owner_user_id ON public.family_links(owner_user_id);
CREATE INDEX idx_family_links_member_user_id ON public.family_links(member_user_id);
CREATE INDEX idx_family_links_owner_phone ON public.family_links(owner_phone) WHERE owner_phone IS NOT NULL;
CREATE INDEX idx_family_links_status ON public.family_links(status);

-- Add trigger for updating updated_at
CREATE TRIGGER update_family_links_updated_at
BEFORE UPDATE ON public.family_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();