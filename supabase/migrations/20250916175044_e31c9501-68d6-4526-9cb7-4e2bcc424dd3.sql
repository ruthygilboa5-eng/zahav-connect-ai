-- איחוד סכימה - שלב 3: טריגרים, Views ואינדקסים

-- 1. עדכון family_members_permissions
ALTER TABLE public.family_members_permissions ADD COLUMN IF NOT EXISTS permission_type TEXT;

-- עדכון נתונים קיימים
UPDATE public.family_members_permissions 
SET permission_type = feature 
WHERE permission_type IS NULL AND feature IS NOT NULL;

-- מילוי הרשאות מאושרות
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

-- 2. יצירת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_status 
ON public.permissions_requests (primary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_main_user 
ON public.family_members (main_user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_permissions_member 
ON public.family_members_permissions (family_member_id, permission_type);

-- 3. טריגר לעדכון email ב-user_profiles מ-auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles 
    SET email = NEW.email, updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. טריגר לסנכרון permissions_requests ל-family_members_permissions
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

-- הפעלת הטריגרים
DROP TRIGGER IF EXISTS sync_permission_grants_trigger ON public.permissions_requests;
CREATE TRIGGER sync_permission_grants_trigger
    AFTER UPDATE OF status ON public.permissions_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_permission_grants();

-- 5. יצירת View לתאימות עם קוד ישן
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

-- 6. View לדשבורד אדמין
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

-- 7. תיקון RLS על טבלאות הגיבוי (אבטחה)
ALTER TABLE public.backup_family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_family_permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_permissions_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_user_profiles ENABLE ROW LEVEL SECURITY;

-- הוספת מדיניות RLS בסיסית לטבלאות הגיבוי (רק לאדמינים)
CREATE POLICY "Admin only access" ON public.backup_family_links FOR ALL USING (false);
CREATE POLICY "Admin only access" ON public.backup_family_permission_requests FOR ALL USING (false);
CREATE POLICY "Admin only access" ON public.backup_permissions_requests FOR ALL USING (false);
CREATE POLICY "Admin only access" ON public.backup_family_members FOR ALL USING (false);
CREATE POLICY "Admin only access" ON public.backup_user_profiles FOR ALL USING (false);