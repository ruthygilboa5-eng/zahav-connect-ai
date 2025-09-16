-- הוספת עמודות חסרות ויצירת אילוצים

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

-- 5. יצירת אילוץ ייחודי
ALTER TABLE public.family_members_permissions 
ADD CONSTRAINT IF NOT EXISTS family_members_permissions_unique_member_permission 
UNIQUE (family_member_id, permission_type);

-- 6. יצירת אינדקסים
CREATE INDEX IF NOT EXISTS idx_permissions_requests_primary_user_status 
ON public.permissions_requests (primary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_family_members_main_user 
ON public.family_members (main_user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_permissions_member 
ON public.family_members_permissions (family_member_id, permission_type);

-- 7. יצירת טריגר לסנכרון הרשאות
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