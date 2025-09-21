-- Fix Security Definer View issues by enabling RLS on views and adding appropriate policies

-- Enable RLS on family_links_legacy view
ALTER TABLE public.family_links_legacy ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for family_links_legacy - users can only see their own family links (as owner or member)
CREATE POLICY "Users can view their own family links legacy" 
ON public.family_links_legacy 
FOR SELECT 
USING (
  (owner_user_id = auth.uid()) OR 
  (member_user_id = auth.uid()) OR
  (owner_email IS NOT NULL AND lower(owner_email) = lower(get_current_user_email()))
);

-- Enable RLS on v_permission_requests_admin view  
ALTER TABLE public.v_permission_requests_admin ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for v_permission_requests_admin - admins can see all, primary users can see their own
CREATE POLICY "Admins can view all permission requests admin view" 
ON public.v_permission_requests_admin 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Primary users can view their own permission requests admin view" 
ON public.v_permission_requests_admin 
FOR SELECT 
USING (primary_user_id = auth.uid());