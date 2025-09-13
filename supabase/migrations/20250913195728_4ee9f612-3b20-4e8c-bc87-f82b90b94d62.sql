-- Create family_members_permissions table for managing permission requests
CREATE TABLE public.family_members_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_member_id UUID NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('wakeup', 'memories', 'games', 'reminders', 'emergency', 'contacts', 'family_board')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Add constraint to prevent duplicate pending requests for same feature
  UNIQUE(family_member_id, feature, status)
);

-- Add foreign key constraint (assuming family_members table exists or using family_links)
-- We'll link to family_links table since that's what's being used in the current system
ALTER TABLE public.family_members_permissions 
ADD CONSTRAINT fk_family_member 
FOREIGN KEY (family_member_id) REFERENCES public.family_links(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.family_members_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for family members to view and create their own permission requests
CREATE POLICY "Family members can view their own permission requests" 
ON public.family_members_permissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.family_links fl 
    WHERE fl.id = family_members_permissions.family_member_id 
    AND fl.member_user_id = auth.uid()
  )
);

CREATE POLICY "Family members can create their own permission requests" 
ON public.family_members_permissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_links fl 
    WHERE fl.id = family_members_permissions.family_member_id 
    AND fl.member_user_id = auth.uid()
  )
);

-- Create policy for main users to view and update permission requests for their family members
CREATE POLICY "Main users can view permission requests for their family members" 
ON public.family_members_permissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.family_links fl 
    WHERE fl.id = family_members_permissions.family_member_id 
    AND fl.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Main users can update permission requests for their family members" 
ON public.family_members_permissions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.family_links fl 
    WHERE fl.id = family_members_permissions.family_member_id 
    AND fl.owner_user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_members_permissions_updated_at
BEFORE UPDATE ON public.family_members_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_family_members_permissions_member_id ON public.family_members_permissions(family_member_id);
CREATE INDEX idx_family_members_permissions_status ON public.family_members_permissions(status);
CREATE INDEX idx_family_members_permissions_feature ON public.family_members_permissions(feature);