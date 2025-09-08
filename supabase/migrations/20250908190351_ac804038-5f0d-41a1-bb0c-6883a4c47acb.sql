-- Add new fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN birth_date DATE,
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say'));

-- Add relationship field to family_links table
ALTER TABLE public.family_links 
ADD COLUMN relationship_to_primary_user TEXT;