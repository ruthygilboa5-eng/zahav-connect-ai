-- Create missing tables that the app is trying to query

-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create policies for memories
CREATE POLICY "Users can view their own memories" 
ON public.memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders
CREATE POLICY "Users can view their own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create pending_queue table
CREATE TABLE public.pending_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pending_queue
ALTER TABLE public.pending_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_queue
CREATE POLICY "Users can view their own pending items" 
ON public.pending_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending items" 
ON public.pending_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending items" 
ON public.pending_queue 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending items" 
ON public.pending_queue 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create family_permission_requests table
CREATE TABLE public.family_permission_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  family_link_id UUID NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for family_permission_requests
ALTER TABLE public.family_permission_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for family_permission_requests
CREATE POLICY "Owners can view their permission requests" 
ON public.family_permission_requests 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create permission requests" 
ON public.family_permission_requests 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their permission requests" 
ON public.family_permission_requests 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their permission requests" 
ON public.family_permission_requests 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_queue_updated_at
BEFORE UPDATE ON public.pending_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_permission_requests_updated_at
BEFORE UPDATE ON public.family_permission_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Now assign the primary_user role to the existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('ba7bc1d2-9748-4755-ada9-67f1ea76e79d', 'primary_user');