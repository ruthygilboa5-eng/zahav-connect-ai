-- BACKUP MIGRATION - גיבוי טבלאות קיימות לפני איחוד הסכימה
-- יצירת טבלאות גיבוי עם תחיליות backup_ לשמירת הנתונים הקיימים

-- 1. גיבוי family_links
CREATE TABLE IF NOT EXISTS public.backup_family_links AS 
SELECT * FROM public.family_links;

-- 2. גיבוי family_permission_requests  
CREATE TABLE IF NOT EXISTS public.backup_family_permission_requests AS 
SELECT * FROM public.family_permission_requests;

-- 3. גיבוי permissions_requests
CREATE TABLE IF NOT EXISTS public.backup_permissions_requests AS 
SELECT * FROM public.permissions_requests;

-- 4. גיבוי family_members
CREATE TABLE IF NOT EXISTS public.backup_family_members AS 
SELECT * FROM public.family_members;

-- 5. גיבוי user_profiles
CREATE TABLE IF NOT EXISTS public.backup_user_profiles AS 
SELECT * FROM public.user_profiles;

-- הוספת הערות לגיבויים
COMMENT ON TABLE public.backup_family_links IS 'גיבוי של family_links לפני איחוד סכימה';
COMMENT ON TABLE public.backup_family_permission_requests IS 'גיבוי של family_permission_requests לפני איחוד סכימה';
COMMENT ON TABLE public.backup_permissions_requests IS 'גיבוי של permissions_requests לפני איחוד סכימה';
COMMENT ON TABLE public.backup_family_members IS 'גיבוי של family_members לפני איחוד סכימה';
COMMENT ON TABLE public.backup_user_profiles IS 'גיבוי של user_profiles לפני איחוד סכימה';