-- תיקון אילוצים ייחודיים ו-RLS

-- 1. יצירת אילוץ ייחודי על family_members_permissions
ALTER TABLE public.family_members_permissions 
DROP CONSTRAINT IF EXISTS family_members_permissions_family_member_id_permission_type_key CASCADE;

-- הסרת כפילויות קיימות לפני יצירת האילוץ
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

-- יצירת האילוץ הייחודי
ALTER TABLE public.family_members_permissions 
ADD CONSTRAINT family_members_permissions_unique_member_permission 
UNIQUE (family_member_id, permission_type);

-- 2. מילוי הרשאות מאושרות (עכשיו עם האילוץ הייחודי)
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

-- 3. יצירת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_status 
ON public.permissions_requests (primary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_main_user 
ON public.family_members (main_user_id);

-- 4. יצירת View לתאימות עם קוד ישן
CREATE OR REPLACE VIEW public.family_links_legacy AS
SELECT 
    fm.id,
    fm.main_user_id as owner_user_id,
    fm.user_id as member_user_id,
    fm.full_name,
    fm.relationship_label as relation,
    fm.phone,
    '' as owner_phone,
    fm.status,
    ARRAY[]::text[] as scopes,
    fm.email,
    up.email as owner_email,
    fm.relationship_label as relationship_to_primary_user,
    fm.gender,
    fm.created_at,
    fm.updated_at
FROM public.family_members fm
JOIN public.user_profiles up ON up.user_id = fm.main_user_id;

-- 5. View לדשבורד אדמין
CREATE OR REPLACE VIEW public.v_permission_requests_admin AS
SELECT 
    pr.id,
    pr.created_at,
    pr.updated_at,
    pr.status,
    pr.permission_type,
    fm.full_name AS family_member_name,
    fm.email AS family_member_email,
    up.full_name AS primary_user_name,
    up.email AS primary_user_email,
    pr.primary_user_id,
    pr.family_member_id
FROM public.permissions_requests pr
JOIN public.family_members fm ON fm.id = pr.family_member_id
JOIN public.user_profiles up ON up.user_id = pr.primary_user_id
ORDER BY pr.created_at DESC;