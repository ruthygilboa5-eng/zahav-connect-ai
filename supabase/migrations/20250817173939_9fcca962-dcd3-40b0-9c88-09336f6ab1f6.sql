-- Fix RLS policies to allow basic user operations without requiring specific roles

-- Drop restrictive policies for contacts
DROP POLICY IF EXISTS "Main users can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Family members can view assigned contacts" ON public.contacts;

-- Create new permissive policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (owner_user_id = auth.uid()) 
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (owner_user_id = auth.uid());

-- Also add a default role assignment for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''));
  
  -- Assign default main_user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'main_user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();