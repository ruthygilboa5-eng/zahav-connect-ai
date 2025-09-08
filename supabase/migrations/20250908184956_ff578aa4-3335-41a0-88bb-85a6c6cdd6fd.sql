-- Fix security issues found in the security scan

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can create permission requests" ON public.permissions_requests;
DROP POLICY IF EXISTS "Anyone can create family links" ON public.family_links;

-- Create secure policies that require authentication for INSERT operations
CREATE POLICY "Authenticated users can create permission requests" 
ON public.permissions_requests 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can create family links" 
ON public.family_links 
FOR INSERT 
TO authenticated  
WITH CHECK (true);