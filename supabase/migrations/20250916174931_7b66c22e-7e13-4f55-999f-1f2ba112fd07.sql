-- תיקון נתונים חסרים - שלב 1: הוספת עמודות חדשות
-- הוספת עמודת role ל-user_profiles וטיפול בנתונים חסרים

-- 1. הוספת עמודת role אם לא קיימת
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. מילוי אימיילים חסרים מתוך auth.users  
UPDATE public.user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- 3. מילוי שמות חסרים אם יש
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

-- 4. מילוי ערכי ברירת מחדל לנתונים שעדיין חסרים
UPDATE public.user_profiles 
SET 
    email = COALESCE(NULLIF(email, ''), 'user-' || user_id::text || '@temp.com'),
    first_name = COALESCE(NULLIF(first_name, ''), 'משתמש'),
    last_name = COALESCE(NULLIF(last_name, ''), 'זמני')
WHERE email IS NULL OR email = '' OR first_name IS NULL OR first_name = '';

-- 5. עדכון roles מטבלת user_roles
UPDATE public.user_profiles 
SET role = ur.role::text
FROM public.user_roles ur 
WHERE user_profiles.user_id = ur.user_id;

-- 6. הגדרת ברירת מחדל לrole
UPDATE public.user_profiles 
SET role = 'primary_user' 
WHERE role IS NULL;