-- Step 1: Remove all foreign key constraints that might be causing issues
ALTER TABLE family_members_permissions DROP CONSTRAINT IF EXISTS fk_family_member;
ALTER TABLE family_members_permissions DROP CONSTRAINT IF EXISTS family_members_permissions_family_member_id_fkey;

-- Step 2: Clear problematic data first
TRUNCATE TABLE family_members_permissions RESTART IDENTITY CASCADE;
TRUNCATE TABLE family_members RESTART IDENTITY CASCADE;

-- Step 3: Consolidate family members data from all sources
INSERT INTO family_members (
  main_user_id, user_id, full_name, email, relationship_label, 
  gender, phone, status, created_at, updated_at
)
WITH consolidated_data AS (
  -- From family_members backup (if any existed)
  SELECT DISTINCT ON (main_user_id, email)
    main_user_id,
    user_id,
    full_name,
    email,
    relationship_label,
    gender,
    phone,
    status,
    created_at,
    updated_at
  FROM backup_family_members
  WHERE email IS NOT NULL AND main_user_id IS NOT NULL
  
  UNION ALL
  
  -- From family_links
  SELECT DISTINCT ON (owner_user_id, email)
    fl.owner_user_id as main_user_id,
    fl.member_user_id as user_id,
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
)
SELECT DISTINCT ON (main_user_id, email)
  main_user_id,
  user_id,
  full_name,
  email,
  relationship_label,
  gender,
  phone,
  status,
  created_at,
  updated_at
FROM consolidated_data 
WHERE email IS NOT NULL AND main_user_id IS NOT NULL
ORDER BY main_user_id, email, created_at DESC;