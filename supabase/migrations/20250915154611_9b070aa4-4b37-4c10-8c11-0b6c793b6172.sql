-- Create or update function to sync family_links to family_members
CREATE OR REPLACE FUNCTION public.sync_family_links_to_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a family_link is updated, sync the data to family_members
  IF TG_OP = 'UPDATE' THEN
    -- Update existing family_member record if it exists
    UPDATE public.family_members
    SET 
      full_name = NEW.full_name,
      relationship_label = COALESCE(NEW.relationship_to_primary_user, NEW.relation),
      gender = NEW.gender,
      email = NEW.email,
      phone = NEW.phone,
      updated_at = now()
    WHERE main_user_id = NEW.owner_user_id 
      AND email IS NOT NULL 
      AND NEW.email IS NOT NULL
      AND lower(email) = lower(NEW.email);
    
    -- If no record was updated and we have valid data, create new one
    IF NOT FOUND AND NEW.email IS NOT NULL AND NEW.owner_user_id IS NOT NULL THEN
      INSERT INTO public.family_members (
        main_user_id,
        full_name,
        relationship_label,
        gender,
        email,
        phone,
        status
      ) VALUES (
        NEW.owner_user_id,
        NEW.full_name,
        COALESCE(NEW.relationship_to_primary_user, NEW.relation),
        NEW.gender,
        NEW.email,
        NEW.phone,
        'ACTIVE'
      )
      ON CONFLICT (main_user_id, email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        relationship_label = EXCLUDED.relationship_label,
        gender = EXCLUDED.gender,
        phone = EXCLUDED.phone,
        updated_at = now();
    END IF;
  END IF;
  
  -- When a family_link is inserted, create corresponding family_member
  IF TG_OP = 'INSERT' THEN
    IF NEW.email IS NOT NULL AND NEW.owner_user_id IS NOT NULL THEN
      INSERT INTO public.family_members (
        main_user_id,
        full_name,
        relationship_label,
        gender,
        email,
        phone,
        status
      ) VALUES (
        NEW.owner_user_id,
        NEW.full_name,
        COALESCE(NEW.relationship_to_primary_user, NEW.relation),
        NEW.gender,
        NEW.email,
        NEW.phone,
        'ACTIVE'
      )
      ON CONFLICT (main_user_id, email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        relationship_label = EXCLUDED.relationship_label,
        gender = EXCLUDED.gender,
        phone = EXCLUDED.phone,
        updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_family_links_to_members_trigger ON public.family_links;

-- Create new trigger
CREATE TRIGGER sync_family_links_to_members_trigger
  AFTER INSERT OR UPDATE ON public.family_links
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_family_links_to_members();

-- Create unique constraint on family_members to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'family_members_main_user_email_unique'
  ) THEN
    ALTER TABLE public.family_members 
    ADD CONSTRAINT family_members_main_user_email_unique 
    UNIQUE (main_user_id, email);
  END IF;
END $$;