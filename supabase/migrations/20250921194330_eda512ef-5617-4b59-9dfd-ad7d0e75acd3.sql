-- Enable RLS on the admin view
ALTER TABLE public.v_permission_requests_admin ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all permission requests
CREATE POLICY "Admins can view all permission requests admin view" 
ON public.v_permission_requests_admin 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for main users to view only their own permission requests
CREATE POLICY "Main users can view their own permission requests admin view" 
ON public.v_permission_requests_admin 
FOR SELECT 
USING (primary_user_id = auth.uid());