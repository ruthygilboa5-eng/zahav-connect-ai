-- Fix data issues and add missing family member
-- Step 1: Fix role for רותי אביטל - should be family_member, not primary_user
UPDATE user_roles 
SET role = 'family_member'::app_role
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ruthyavital22@gmail.com');

UPDATE user_profiles 
SET role = 'family_member'
WHERE email = 'ruthyavital22@gmail.com';

-- Step 2: Update family_members to set correct user_id for רותי
UPDATE family_members 
SET user_id = (SELECT user_id FROM user_profiles WHERE email = 'ruthyavital22@gmail.com')
WHERE email = 'ruthyavital22@gmail.com';

-- Step 3: Add נועה גלבוע as family member to שלמה אביטל
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
) ON CONFLICT (main_user_id, email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  full_name = EXCLUDED.full_name,
  relationship_label = EXCLUDED.relationship_label,
  status = EXCLUDED.status,
  updated_at = NOW();