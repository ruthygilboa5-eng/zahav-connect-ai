-- תיקון נתונים חסרים לפני איחוד הסכימה
-- מילוי ערכי email חסרים ב-user_profiles

-- 1. מילוי אימיילים חסרים מתוך auth.users
UPDATE public.user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- 2. מילוי שמות חסרים אם יש
UPDATE public.user_profiles 
SET first_name = COALESCE(
    NULLIF(first_name, ''), 
    SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 1),
    'משתמש'
),
last_name = COALESCE(
    NULLIF(last_name, ''), 
    SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 2),
    ''
)
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
AND (user_profiles.first_name IS NULL OR user_profiles.first_name = '');

-- 3. מילוי ערכי ברירת מחדל לנתונים שעדיין חסרים
UPDATE public.user_profiles 
SET 
    email = 'user-' || user_id::text || '@temp.com',
    first_name = COALESCE(NULLIF(first_name, ''), 'משתמש'),
    last_name = COALESCE(NULLIF(last_name, ''), 'זמני')
WHERE email IS NULL OR email = '' OR first_name IS NULL OR first_name = '';

-- 4. עדכון roles מטבלת user_roles
UPDATE public.user_profiles 
SET role = ur.role::text
FROM public.user_roles ur 
WHERE user_profiles.user_id = ur.user_id;

-- 5. הגדרת ברירת מחדל לrole
UPDATE public.user_profiles 
SET role = 'primary_user' 
WHERE role IS NULL;