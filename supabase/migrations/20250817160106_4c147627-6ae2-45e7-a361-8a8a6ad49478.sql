-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('main_user', 'family_basic', 'family_emergency');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Main users can manage family roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'main_user') OR 
    user_id = auth.uid()
  );

-- Update contacts table to link to main user
ALTER TABLE contacts ADD COLUMN main_user_id UUID REFERENCES auth.users(id);

-- Update contacts RLS policies
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON contacts;

CREATE POLICY "Main users can manage all contacts"
  ON public.contacts
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'main_user') AND owner_user_id = auth.uid()
  );

CREATE POLICY "Family members can view assigned contacts"
  ON public.contacts
  FOR SELECT
  USING (
    main_user_id = auth.uid() OR
    (public.has_role(auth.uid(), 'family_basic') AND 
     EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND granted_by_user_id = main_user_id))
  );