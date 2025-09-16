-- SCHEMA UNIFICATION MIGRATION - איחוד סכימה מקיף
-- מיגרציה זו מאחדת את כל הטבלאות למבנה מקיף וברור

-- ======================================
-- 1. עדכון user_profiles להיות מקור האמת
-- ======================================

-- הוספת עמודת role ל-user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role TEXT;
    END IF;
END $$;

-- עדכון user_profiles עם נתונים מ-auth.users ומ-user_roles
UPDATE public.user_profiles 
SET email = COALESCE(user_profiles.email, au.email)
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- עדכון roles מטבלת user_roles
UPDATE public.user_profiles 
SET role = ur.role::text
FROM public.user_roles ur 
WHERE user_profiles.user_id = ur.user_id;

-- הגדרת ברירת מחדל לrole
UPDATE public.user_profiles 
SET role = 'primary_user' 
WHERE role IS NULL;

-- הוספת אילוצים
ALTER TABLE public.user_profiles 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- יצירת עמודת full_name מחושבת
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
    END IF;
END $$;

-- ======================================
-- 2. עדכון family_members להיות מקור האמת
-- ======================================

-- הוספת עמודות חסרות ל-family_members
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'family_members' AND column_name = 'user_id') THEN
        ALTER TABLE public.family_members ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'family_members' AND column_name = 'birth_date') THEN
        ALTER TABLE public.family_members ADD COLUMN birth_date DATE;
    END IF;
END $$;

-- העברת נתונים מ-family_links ל-family_members
INSERT INTO public.family_members (
    main_user_id, user_id, email, full_name, relationship_label, gender, phone, status
)
SELECT DISTINCT
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
ON CONFLICT (main_user_id, email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    relationship_label = EXCLUDED.relationship_label,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    updated_at = now();

-- ======================================
-- 3. איחוד permissions_requests למקור אמת יחיד
-- ======================================

-- עדכון מבנה permissions_requests
ALTER TABLE public.permissions_requests 
DROP COLUMN IF EXISTS family_member_name,
DROP COLUMN IF EXISTS family_member_email,
DROP COLUMN IF EXISTS requested_permissions;

-- הוספת עמודות נדרשות אם לא קיימות
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'permissions_requests' AND column_name = 'family_member_id') THEN
        ALTER TABLE public.permissions_requests ADD COLUMN family_member_id UUID NOT NULL;
    END IF;
END $$;

-- העברת נתונים מ-family_permission_requests ל-permissions_requests
INSERT INTO public.permissions_requests (
    primary_user_id, family_member_id, permission_type, status, created_at, updated_at
)
SELECT 
    fpr.owner_user_id as primary_user_id,
    (SELECT fm.id FROM public.family_members fm 
     JOIN public.family_links fl ON fl.id = fpr.family_link_id 
     WHERE fm.main_user_id = fl.owner_user_id 
     AND fm.email = fl.email LIMIT 1) as family_member_id,
    fpr.scope as permission_type,
    fpr.status,
    fpr.created_at,
    fpr.updated_at
FROM public.family_permission_requests fpr
WHERE NOT EXISTS (
    SELECT 1 FROM public.permissions_requests pr 
    WHERE pr.primary_user_id = fpr.owner_user_id 
    AND pr.permission_type = fpr.scope
);

-- ======================================
-- 4. יצירת family_members_permissions למצב נוכחי
-- ======================================

-- הוספת עמודות חסרות אם לא קיימות
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'family_members_permissions' AND column_name = 'permission_type') THEN
        ALTER TABLE public.family_members_permissions ADD COLUMN permission_type TEXT;
    END IF;
END $$;

-- עדכון שם עמודה feature ל-permission_type
UPDATE public.family_members_permissions 
SET permission_type = feature 
WHERE permission_type IS NULL;

-- מילוי נתונים מהרשאות מאושרות
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
AND NOT EXISTS (
    SELECT 1 FROM public.family_members_permissions fmp 
    WHERE fmp.family_member_id = pr.family_member_id 
    AND fmp.permission_type = pr.permission_type
)
ON CONFLICT (family_member_id, permission_type) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now();

-- ======================================
-- 5. יצירת אילוצים ואינדקסים
-- ======================================

-- אילוצי UNIQUE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_requests_unique_pending') THEN
        ALTER TABLE public.permissions_requests 
        ADD CONSTRAINT permissions_requests_unique_pending 
        UNIQUE (family_member_id, permission_type, status);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- ignore if constraint already exists
END $$;

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_status 
ON public.permissions_requests (primary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_main_user 
ON public.family_members (main_user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_permissions_member 
ON public.family_members_permissions (family_member_id, permission_type);

-- ======================================
-- 6. טריגרים לסנכרון אוטומטי
-- ======================================

-- טריגר לעדכון email ב-user_profiles מ-auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles 
    SET email = NEW.email, updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_email();

-- טריגר לסנכרון permissions_requests ל-family_members_permissions
CREATE OR REPLACE FUNCTION public.sync_permission_grants()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        INSERT INTO public.family_members_permissions (
            main_user_id, family_member_id, permission_type, status
        ) VALUES (
            NEW.primary_user_id, NEW.family_member_id, NEW.permission_type, 'approved'
        )
        ON CONFLICT (family_member_id, permission_type) 
        DO UPDATE SET status = 'approved', updated_at = now();
    ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
        UPDATE public.family_members_permissions 
        SET status = 'revoked', updated_at = now()
        WHERE family_member_id = NEW.family_member_id 
        AND permission_type = NEW.permission_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_permission_grants_trigger ON public.permissions_requests;
CREATE TRIGGER sync_permission_grants_trigger
    AFTER UPDATE OF status ON public.permissions_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_permission_grants();

-- ======================================
-- 7. יצירת View לתאימות עם קוד ישן
-- ======================================

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

-- ======================================
-- 8. View לדשבורד אדמין
-- ======================================

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