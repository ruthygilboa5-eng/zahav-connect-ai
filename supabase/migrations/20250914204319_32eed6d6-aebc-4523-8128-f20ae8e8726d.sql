-- Fix security warnings by setting search_path on functions
DROP FUNCTION IF EXISTS public.set_permission_main_user_id();
CREATE OR REPLACE FUNCTION public.set_permission_main_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get main_user_id from family_links when inserting permission
  SELECT fl.owner_user_id INTO NEW.main_user_id
  FROM public.family_links fl
  WHERE fl.id = NEW.family_member_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix existing function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;