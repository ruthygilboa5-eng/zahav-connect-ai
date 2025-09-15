-- Allow family members to update their own family_link rows (for profile fields)
create policy if not exists "Family members can update their own family link"
  on public.family_links
  for update
  using (auth.uid() = member_user_id)
  with check (auth.uid() = member_user_id);

-- Function to sync relationship from family_links to family_members when updated by a family member
create or replace function public.sync_family_link_to_family_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    -- Update relationship_label on the main user's family_members if we can uniquely match by email and main user
    update public.family_members fm
      set relationship_label = coalesce(NEW.relationship_to_primary_user, NEW.relation, fm.relationship_label),
          updated_at = now()
    where fm.main_user_id = NEW.owner_user_id
      and fm.email is not null
      and NEW.email is not null
      and lower(fm.email) = lower(NEW.email);
  end if;
  return NEW;
end;
$$;

-- Trigger on family_links to propagate relationship changes
drop trigger if exists trg_sync_family_link_to_family_members on public.family_links;
create trigger trg_sync_family_link_to_family_members
after update of relationship_to_primary_user, relation, email on public.family_links
for each row execute function public.sync_family_link_to_family_members();