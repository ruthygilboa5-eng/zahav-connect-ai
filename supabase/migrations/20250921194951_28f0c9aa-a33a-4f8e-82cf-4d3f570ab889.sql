-- Fix search path for security definer functions to prevent security issues
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION public.get_message_template(p_feature text, p_gender text) SET search_path = public;
ALTER FUNCTION public.get_user_role(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_id_by_email(email_address text) SET search_path = public;
ALTER FUNCTION public.get_current_user_email() SET search_path = public;