-- Allow 'chat' feature in family_members_permissions to fix check constraint errors
ALTER TABLE public.family_members_permissions
  DROP CONSTRAINT IF EXISTS family_members_permissions_feature_check;

ALTER TABLE public.family_members_permissions
  ADD CONSTRAINT family_members_permissions_feature_check
  CHECK (feature IN (
    'wakeup', 'memories', 'games', 'reminders', 'emergency', 'contacts', 'family_board', 'chat'
  ));