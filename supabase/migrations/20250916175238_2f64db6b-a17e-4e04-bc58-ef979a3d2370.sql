-- תיקון אילוץ ייחודי עם בדיקת קיום

-- 1. הוספת עמודת permission_type אם חסרה
ALTER TABLE public.family_members_permissions ADD COLUMN IF NOT EXISTS permission_type TEXT;

-- 2. עדכון נתונים קיימים מעמודת feature
UPDATE public.family_members_permissions 
SET permission_type = feature 
WHERE permission_type IS NULL AND feature IS NOT NULL;

-- 3. הוספת ערכים ברירת מחדל לעמודות ריקות
UPDATE public.family_members_permissions 
SET permission_type = 'unknown'
WHERE permission_type IS NULL;

-- 4. הסרת כפילויות קיימות
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY family_member_id, permission_type ORDER BY created_at DESC) as rn
    FROM public.family_members_permissions
    WHERE family_member_id IS NOT NULL AND permission_type IS NOT NULL
)
DELETE FROM public.family_members_permissions 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 5. יצירת אילוץ ייחודי (עם בדיקת קיום)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'family_members_permissions_unique_member_permission'
    ) THEN
        ALTER TABLE public.family_members_permissions 
        ADD CONSTRAINT family_members_permissions_unique_member_permission 
        UNIQUE (family_member_id, permission_type);
    END IF;
END $$;

-- 6. יצירת אינדקסים
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_status 
ON public.permissions_requests (primary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_main_user 
ON public.family_members (main_user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_permissions_member 
ON public.family_members_permissions (family_member_id, permission_type);

-- 7. מילוי הרשאות מאושרות
INSERT INTO public.family_members_permissions (
    main_user_id, family_member_id, permission_type, status, created_at, updated_at
)
SELECT DISTINCT
    pr.primary_user_id as main_user_id,
    pr.family_member_id,
    pr.permission_type,
    'approved' as status,
    pr.created_at,
    pr.updated_at
FROM public.permissions_requests pr
WHERE pr.status = 'approved'
AND pr.family_member_id IS NOT NULL
AND pr.permission_type IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.family_members_permissions fmp 
    WHERE fmp.family_member_id = pr.family_member_id 
    AND fmp.permission_type = pr.permission_type
)
ON CONFLICT (family_member_id, permission_type) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now();