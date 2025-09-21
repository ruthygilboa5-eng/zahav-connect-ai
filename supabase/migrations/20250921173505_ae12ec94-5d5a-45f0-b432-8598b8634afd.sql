-- Simplified migration - clear and rebuild core tables
-- Step 1: Clear all interconnected tables safely
TRUNCATE TABLE family_members_permissions CASCADE;
TRUNCATE TABLE permissions_requests CASCADE;
TRUNCATE TABLE family_members CASCADE;

-- Step 2: Insert consolidated family members data
INSERT INTO family_members (
  main_user_id, full_name, email, relationship_label, 
  gender, phone, status, created_at, updated_at
)
SELECT DISTINCT ON (owner_user_id, email)
  fl.owner_user_id as main_user_id,
  fl.full_name,
  fl.email,
  COALESCE(fl.relationship_to_primary_user, fl.relation) as relationship_label,
  fl.gender,
  fl.phone,
  CASE 
    WHEN fl.status = 'APPROVED' THEN 'ACTIVE'
    WHEN fl.status = 'PENDING' THEN 'PENDING'
    ELSE 'INACTIVE'
  END as status,
  fl.created_at,
  fl.updated_at
FROM family_links fl
WHERE fl.email IS NOT NULL AND fl.owner_user_id IS NOT NULL
ORDER BY owner_user_id, email, created_at DESC;

-- Step 3: Update user_id for family members based on user_profiles
UPDATE family_members fm
SET user_id = up.user_id
FROM user_profiles up
WHERE LOWER(fm.email) = LOWER(up.email)
  AND up.role = 'family_member';

-- Step 4: Drop unnecessary tables to avoid confusion
DROP TABLE IF EXISTS backup_family_links CASCADE;
DROP TABLE IF EXISTS backup_family_members CASCADE;
DROP TABLE IF EXISTS backup_family_permission_requests CASCADE;
DROP TABLE IF EXISTS backup_permissions_requests CASCADE;
DROP TABLE IF EXISTS backup_user_profiles CASCADE;
DROP TABLE IF EXISTS family_permission_requests CASCADE;
DROP VIEW IF EXISTS family_links_legacy CASCADE;