-- Create UserProfile table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create Contact table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('FAMILY', 'INSTITUTION', 'NEIGHBOR', 'CAREGIVER', 'OTHER')),
  phone TEXT NOT NULL,
  is_emergency_candidate BOOLEAN DEFAULT false,
  emergency_status TEXT DEFAULT 'NONE' CHECK (emergency_status IN ('NONE', 'PENDING', 'APPROVED', 'DECLINED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Create EmergencyConsent table
CREATE TABLE public.emergency_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_consents ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency consents
CREATE POLICY "Users can view consents for their contacts" 
ON public.emergency_consents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contacts 
  WHERE contacts.id = emergency_consents.contact_id 
  AND contacts.owner_user_id = auth.uid()
));

CREATE POLICY "Users can create consents for their contacts" 
ON public.emergency_consents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contacts 
  WHERE contacts.id = emergency_consents.contact_id 
  AND contacts.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update consents for their contacts" 
ON public.emergency_consents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contacts 
  WHERE contacts.id = emergency_consents.contact_id 
  AND contacts.owner_user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_consents_updated_at
BEFORE UPDATE ON public.emergency_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();