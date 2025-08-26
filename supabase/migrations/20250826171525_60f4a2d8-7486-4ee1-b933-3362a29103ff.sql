-- Fix column names to match what the application expects

-- Add owner_user_id columns to tables and copy data from user_id
ALTER TABLE public.memories ADD COLUMN owner_user_id UUID;
UPDATE public.memories SET owner_user_id = user_id;
ALTER TABLE public.memories ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE public.reminders ADD COLUMN owner_user_id UUID;
UPDATE public.reminders SET owner_user_id = user_id;
ALTER TABLE public.reminders ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE public.pending_queue ADD COLUMN owner_user_id UUID;
UPDATE public.pending_queue SET owner_user_id = user_id;
ALTER TABLE public.pending_queue ALTER COLUMN owner_user_id SET NOT NULL;

-- Update RLS policies to use owner_user_id

-- Drop old policies for memories
DROP POLICY "Users can view their own memories" ON public.memories;
DROP POLICY "Users can create their own memories" ON public.memories;
DROP POLICY "Users can update their own memories" ON public.memories;
DROP POLICY "Users can delete their own memories" ON public.memories;

-- Create new policies with owner_user_id
CREATE POLICY "Users can view their own memories" 
ON public.memories 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own memories" 
ON public.memories 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own memories" 
ON public.memories 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.memories 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Drop old policies for reminders
DROP POLICY "Users can view their own reminders" ON public.reminders;
DROP POLICY "Users can create their own reminders" ON public.reminders;
DROP POLICY "Users can update their own reminders" ON public.reminders;
DROP POLICY "Users can delete their own reminders" ON public.reminders;

-- Create new policies with owner_user_id
CREATE POLICY "Users can view their own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Drop old policies for pending_queue
DROP POLICY "Users can view their own pending items" ON public.pending_queue;
DROP POLICY "Users can create their own pending items" ON public.pending_queue;
DROP POLICY "Users can update their own pending items" ON public.pending_queue;
DROP POLICY "Users can delete their own pending items" ON public.pending_queue;

-- Create new policies with owner_user_id
CREATE POLICY "Users can view their own pending items" 
ON public.pending_queue 
FOR SELECT 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own pending items" 
ON public.pending_queue 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own pending items" 
ON public.pending_queue 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own pending items" 
ON public.pending_queue 
FOR DELETE 
USING (auth.uid() = owner_user_id);