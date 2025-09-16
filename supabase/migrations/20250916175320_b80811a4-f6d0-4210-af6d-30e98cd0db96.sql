-- השלמת איחוד הסכימה - Views, טריגרים ותיקון RLS

-- 1. יצירת טריגר לסנכרון הרשאות
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

-- הפעלת הטריגר
DROP TRIGGER IF EXISTS sync_permission_grants_trigger ON public.permissions_requests;
CREATE TRIGGER sync_permission_grants_trigger
    AFTER UPDATE OF status ON public.permissions_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_permission_grants();

-- 2. יצירת View לתאימות עם קוד ישן
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

-- 3. View לדשבורד אדמין
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

-- 4. תיקון RLS על טבלאות הגיבוי
ALTER TABLE public.backup_family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_family_permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_permissions_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_user_profiles ENABLE ROW LEVEL SECURITY;

-- הוספת מדיניות RLS בסיסית לטבלאות הגיבוי (רק לאדמינים)
DROP POLICY IF EXISTS "Admin only access" ON public.backup_family_links;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_family_permission_requests;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_permissions_requests;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_family_members;
DROP POLICY IF EXISTS "Admin only access" ON public.backup_user_profiles;

CREATE POLICY "Admin only access" ON public.backup_family_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only access" ON public.backup_family_permission_requests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only access" ON public.backup_permissions_requests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only access" ON public.backup_family_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin only access" ON public.backup_user_profiles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. הוספת הערות לתיעוד
COMMENT ON TABLE public.user_profiles IS 'מקור אמת לפרופילי משתמשים - primary users + admins';
COMMENT ON TABLE public.family_members IS 'מקור אמת לבני משפחה';  
COMMENT ON TABLE public.permissions_requests IS 'מקור אמת לכל בקשות ההרשאות';
COMMENT ON TABLE public.family_members_permissions IS 'מצב נוכחי של הרשאות מאושרות';
COMMENT ON VIEW public.family_links_legacy IS 'View לתאימות עם קוד ישן - מפנה ל-family_members';
COMMENT ON VIEW public.v_permission_requests_admin IS 'View לדשבורד ניהול - כל הבקשות עם פרטי המשתמשים';