-- Create message_templates table for storing notification templates
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature TEXT NOT NULL, -- 'wakeup', 'emergency', 'reminder', etc.
  gender TEXT NOT NULL, -- 'male', 'female', 'neutral'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for message_templates (read-only for authenticated users)
CREATE POLICY "Authenticated users can view message templates" 
ON public.message_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create family_members table for storing family member details
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  relationship_label TEXT NOT NULL, -- 'אבא', 'אמא', 'בן', 'בת', etc.
  gender TEXT NOT NULL, -- 'male', 'female'
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members
CREATE POLICY "Users can view their own family members" 
ON public.family_members 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own family members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own family members" 
ON public.family_members 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own family members" 
ON public.family_members 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample message templates for wakeup feature
INSERT INTO public.message_templates (feature, gender, subject, body) VALUES 
('wakeup', 'male', '🌅 הודעת התעוררת - זהב', '[relationship_label] שלך עדכן שהוא התעורר הבוקר והכל בסדר 💚'),
('wakeup', 'female', '🌅 הודעת התעוررת - זהב', '[relationship_label] שלך עדכנה שהיא התעוררה הבוקר והכל בסדר 💚'),
('wakeup', 'neutral', '🌅 הודעת התעוררת - זהב', '[relationship_label] שלך עדכן שהתעורר הבוקר והכל בסדר 💚');

-- Insert sample emergency templates
INSERT INTO public.message_templates (feature, gender, subject, body) VALUES 
('emergency', 'male', '🚨 הודעת חירום - זהב', '[relationship_label] שלך שלח הודעת חירום 🚨 הוא זקוק לעזרה מיידית!'),
('emergency', 'female', '🚨 הודעת חירום - זהב', '[relationship_label] שלך שלחה הודעת חירום 🚨 היא זקוקה לעזרה מיידית!'),
('emergency', 'neutral', '🚨 הודעת חירום - זהב', '[relationship_label] שלך שלח הודעת חירום 🚨 זקוק לעזרה מיידית!');

-- Insert sample reminder templates
INSERT INTO public.message_templates (feature, gender, subject, body) VALUES 
('reminder', 'male', '⏰ תזכורת - זהב', '[relationship_label] שלך קיבל תזכורת חדשה – הוא ביקש שתוודא/י שיעשה זאת'),
('reminder', 'female', '⏰ תזכורת - זהב', '[relationship_label] שלך קיבלה תזכורת חדשה – היא ביקשה שתוודא/י שתעשה זאת'),
('reminder', 'neutral', '⏰ תזכורת - זהב', '[relationship_label] שלך קיבל תזכורת חדשה – ביקש שתוודא/י שיעשה זאת');