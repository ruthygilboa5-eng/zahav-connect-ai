-- DATABASE CLEANUP AND CONSOLIDATION MIGRATION
-- This migration will unify the data structure and remove duplicate tables

-- Step 1: Create temporary table to consolidate family member data
CREATE TEMP TABLE temp_consolidated_family_members AS
WITH unified_family_data AS (
  -- From family_members (main source)
  SELECT 
    fm.id,
    fm.main_user_id,
    fm.user_id,
    fm.full_name,
    fm.email,
    fm.relationship_label,
    fm.gender,
    fm.phone,
    fm.birth_date,
    fm.status,
    fm.created_at,
    fm.updated_at,
    'family_members' as source_table
  FROM family_members fm
  
  UNION ALL
  
  -- From family_links (backup data)
  SELECT 
    fl.id,
    fl.owner_user_id as main_user_id,
    fl.member_user_id as user_id,
    fl.full_name,
    fl.email,
    COALESCE(fl.relationship_to_primary_user, fl.relation) as relationship_label,
    fl.gender,
    fl.phone,
    NULL as birth_date,
    CASE 
      WHEN fl.status = 'APPROVED' THEN 'ACTIVE'
      WHEN fl.status = 'PENDING' THEN 'PENDING'
      ELSE 'INACTIVE'
    END as status,
    fl.created_at,
    fl.updated_at,
    'family_links' as source_table
  FROM family_links fl
  WHERE NOT EXISTS (
    SELECT 1 FROM family_members fm2 
    WHERE fm2.email = fl.email AND fm2.main_user_id = fl.owner_user_id
  )
)
SELECT DISTINCT ON (main_user_id, email)
  gen_random_uuid() as new_id,
  main_user_id,
  user_id,
  full_name,
  email,
  relationship_label,
  gender,
  phone,
  birth_date,
  status,
  created_at,
  updated_at,
  source_table
FROM unified_family_data
ORDER BY main_user_id, email, created_at DESC;

-- Step 2: Clear and repopulate family_members with consolidated data
TRUNCATE TABLE family_members RESTART IDENTITY CASCADE;

INSERT INTO family_members (
  id, main_user_id, user_id, full_name, email, relationship_label, 
  gender, phone, birth_date, status, created_at, updated_at
)
SELECT 
  new_id, main_user_id, user_id, full_name, email, relationship_label,
  gender, phone, birth_date, status, created_at, updated_at
FROM temp_consolidated_family_members;

-- Step 3: Create mapping table for permission updates
CREATE TEMP TABLE temp_permission_mapping AS
SELECT 
  fmp.id as old_permission_id,
  fmp.main_user_id,
  fmp.feature,
  fmp.status,
  fmp.created_at,
  fmp.updated_at,
  fm_new.id as new_family_member_id,
  fl_old.owner_user_id,
  fl_old.email as family_member_email
FROM family_members_permissions fmp
LEFT JOIN family_links fl_old ON fl_old.id = fmp.family_member_id
LEFT JOIN family_members fm_new ON (
  fm_new.main_user_id = fmp.main_user_id AND 
  fm_new.email = fl_old.email
);

-- Step 4: Clear and repopulate family_members_permissions with correct references
TRUNCATE TABLE family_members_permissions RESTART IDENTITY CASCADE;

INSERT INTO family_members_permissions (
  main_user_id, family_member_id, feature, status, created_at, updated_at
)
SELECT 
  main_user_id, new_family_member_id, feature, status, created_at, updated_at
FROM temp_permission_mapping 
WHERE new_family_member_id IS NOT NULL;