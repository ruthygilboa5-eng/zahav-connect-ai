-- איחוד סכימה מלא - שלב 2: מבנה הטבלאות והאילוצים

-- 1. הוספת אילוצים ל-user_profiles
ALTER TABLE public.user_profiles 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- 2. הוספת עמודת full_name מחושבת ל-user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- 3. הוספת עמודות חסרות ל-family_members
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 4. העברת נתונים מ-family_links ל-family_members (עם טיפול בכפילויות)
INSERT INTO public.family_members (
    main_user_id, user_id, email, full_name, relationship_label, gender, phone, status
)
SELECT DISTINCT ON (fl.owner_user_id, fl.email)
    fl.owner_user_id as main_user_id,
    fl.member_user_id as user_id,
    fl.email,
    fl.full_name,
    COALESCE(fl.relationship_to_primary_user, fl.relation) as relationship_label,
    fl.gender,
    fl.phone,
    CASE 
        WHEN fl.status = 'APPROVED' THEN 'ACTIVE'
        WHEN fl.status = 'PENDING' THEN 'PENDING'
        ELSE 'INACTIVE'
    END as status
FROM public.family_links fl
WHERE fl.email IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.main_user_id = fl.owner_user_id 
    AND fm.email = fl.email
)
ORDER BY fl.owner_user_id, fl.email, fl.created_at DESC
ON CONFLICT (main_user_id, email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    relationship_label = EXCLUDED.relationship_label,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    updated_at = now();

-- 5. תיקון permissions_requests - הסרת עמודות ישנות והוספת חדשות
ALTER TABLE public.permissions_requests 
DROP COLUMN IF EXISTS family_member_name CASCADE,
DROP COLUMN IF EXISTS family_member_email CASCADE,
DROP COLUMN IF EXISTS requested_permissions CASCADE;

-- הוספת family_member_id אם לא קיים (עם ערך ברירת מחדל זמני)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'permissions_requests' AND column_name = 'family_member_id') THEN
        ALTER TABLE public.permissions_requests ADD COLUMN family_member_id UUID;
        
        -- מילוי זמני של family_member_id עם gen_random_uuid() לרשומות קיימות
        UPDATE public.permissions_requests 
        SET family_member_id = gen_random_uuid() 
        WHERE family_member_id IS NULL;
        
        -- עכשיו אפשר להגדיר NOT NULL
        ALTER TABLE public.permissions_requests ALTER COLUMN family_member_id SET NOT NULL;
    END IF;
END $$;

-- 6. העברת נתונים מ-family_permission_requests ל-permissions_requests
INSERT INTO public.permissions_requests (
    primary_user_id, family_member_id, permission_type, status, created_at, updated_at
)
SELECT DISTINCT
    fpr.owner_user_id as primary_user_id,
    COALESCE(
        (SELECT fm.id FROM public.family_members fm 
         JOIN public.family_links fl ON (fm.main_user_id = fl.owner_user_id AND fm.email = fl.email)
         WHERE fl.id = fpr.family_link_id LIMIT 1),
        gen_random_uuid()  -- ערך ברירת מחדל אם לא נמצא
    ) as family_member_id,
    fpr.scope as permission_type,
    LOWER(fpr.status) as status,
    fpr.created_at,
    fpr.updated_at
FROM public.family_permission_requests fpr
WHERE NOT EXISTS (
    SELECT 1 FROM public.permissions_requests pr 
    WHERE pr.primary_user_id = fpr.owner_user_id 
    AND pr.permission_type = fpr.scope
    AND pr.status = LOWER(fpr.status)
);