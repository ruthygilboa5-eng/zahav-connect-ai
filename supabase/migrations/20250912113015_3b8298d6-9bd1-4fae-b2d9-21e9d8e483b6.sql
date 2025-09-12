-- Create helper function to get message templates
CREATE OR REPLACE FUNCTION public.get_message_template(
  p_feature TEXT,
  p_gender TEXT
) RETURNS TABLE (
  subject TEXT,
  body TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT mt.subject, mt.body
  FROM public.message_templates mt
  WHERE mt.feature = p_feature 
    AND mt.gender = p_gender
  LIMIT 1;
  
  -- If no specific gender template found, try neutral
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT mt.subject, mt.body
    FROM public.message_templates mt
    WHERE mt.feature = p_feature 
      AND mt.gender = 'neutral'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;