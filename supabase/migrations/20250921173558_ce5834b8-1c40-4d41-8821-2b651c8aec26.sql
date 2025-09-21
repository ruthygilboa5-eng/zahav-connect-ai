-- Fix roles and add missing family member correctly
-- Step 1: Check and fix roles - delete primary_user role for רותי and ensure family_member exists
DELETE FROM user_roles 
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ruthyavital22@gmail.com')
  AND role = 'primary_user'::app_role;

-- Ensure family_member role exists
INSERT INTO user_roles (user_id, role) 
SELECT user_id, 'family_member'::app_role
FROM user_profiles 
WHERE email = 'ruthyavital22@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Update user_profiles role
UPDATE user_profiles 
SET role = 'family_member'
WHERE email = 'ruthyavital22@gmail.com';

-- Step 3: Update family_members to set correct user_id for רותי
UPDATE family_members 
SET user_id = (SELECT user_id FROM user_profiles WHERE email = 'ruthyavital22@gmail.com')
WHERE email = 'ruthyavital22@gmail.com';

-- Step 4: Add נועה גלבוע as family member to שלמה אביטל
INSERT INTO family_members (
  main_user_id, 
  user_id, 
  full_name, 
  email, 
  relationship_label, 
  gender,
  status,
  created_at,
  updated_at
) VALUES (
  (SELECT user_id FROM user_profiles WHERE email = 'shlomoavital41@gmail.com'),
  (SELECT user_id FROM user_profiles WHERE email = 'vibezahav@gmail.com'),
  'נועה גלבוע',
  'vibezahav@gmail.com',
  'בת',
  'female',
  'PENDING',
  NOW(),
  NOW()
);