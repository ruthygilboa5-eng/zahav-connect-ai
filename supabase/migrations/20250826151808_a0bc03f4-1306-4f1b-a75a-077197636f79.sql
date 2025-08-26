-- Add phone column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN phone text;

-- Create index for phone lookups (unique to prevent duplicates)
CREATE UNIQUE INDEX idx_user_profiles_phone 
ON public.user_profiles(phone) 
WHERE phone IS NOT NULL;

-- Create permissions_requests table for family member approval workflow
CREATE TABLE public.permissions_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_user_id uuid NOT NULL,
  family_member_id uuid NOT NULL,
  family_member_name text NOT NULL,
  family_member_email text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  requested_permissions text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(primary_user_id, family_member_id)
);

-- Enable RLS on permissions_requests
ALTER TABLE public.permissions_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions_requests
CREATE POLICY "Primary users can view their permission requests" 
ON public.permissions_requests 
FOR SELECT 
USING (primary_user_id = auth.uid());

CREATE POLICY "Primary users can update permission requests" 
ON public.permissions_requests 
FOR UPDATE 
USING (primary_user_id = auth.uid());

CREATE POLICY "Anyone can create permission requests" 
ON public.permissions_requests 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_permissions_requests_updated_at
  BEFORE UPDATE ON public.permissions_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();