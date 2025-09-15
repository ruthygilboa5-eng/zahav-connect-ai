-- Allow family members to update their own family_link rows (for profile fields)
CREATE POLICY "Family members can update their own family link"
  ON public.family_links
  FOR UPDATE
  USING (auth.uid() = member_user_id)
  WITH CHECK (auth.uid() = member_user_id);

-- Function to sync relationship from family_links to family_members when updated by a family member
CREATE OR REPLACE FUNCTION public.sync_family_link_to_family_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Update relationship_label on the main user's family_members if we can uniquely match by email and main user
    UPDATE public.family_members fm
      SET relationship_label = coalesce(NEW.relationship_to_primary_user, NEW.relation, fm.relationship_label),
          updated_at = now()
    WHERE fm.main_user_id = NEW.owner_user_id
      AND fm.email IS NOT NULL
      AND NEW.email IS NOT NULL
      AND lower(fm.email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on family_links to propagate relationship changes
DROP TRIGGER IF EXISTS trg_sync_family_link_to_family_members ON public.family_links;
CREATE TRIGGER trg_sync_family_link_to_family_members
AFTER UPDATE OF relationship_to_primary_user, relation, email ON public.family_links
FOR EACH ROW EXECUTE FUNCTION public.sync_family_link_to_family_members();