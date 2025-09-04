-- Add email field to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN email text;

-- Add index for better performance when searching by email
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);