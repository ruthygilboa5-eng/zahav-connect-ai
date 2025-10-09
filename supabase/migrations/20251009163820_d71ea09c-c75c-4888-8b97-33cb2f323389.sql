-- תיקון RLS policies עבור family_members_permissions

-- מחיקת policies ישנות
DROP POLICY IF EXISTS "Family members can create their own permission requests" ON public.family_members_permissions;
DROP POLICY IF EXISTS "Family members can view their own permission requests" ON public.family_members_permissions;
DROP POLICY IF EXISTS "Main users can update permission requests for their family memb" ON public.family_members_permissions;
DROP POLICY IF EXISTS "Main users can view permission requests for their family member" ON public.family_members_permissions;

-- Policy חדש: SELECT - בן משפחה יכול לראות את ההרשאות שלו
CREATE POLICY "Family members can view their own permissions"
ON public.family_members_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links fl
    WHERE fl.id = family_members_permissions.family_member_id
    AND fl.member_user_id = auth.uid()
  )
);

-- Policy חדש: SELECT - משתמש ראשי יכול לראות הרשאות של בני משפחתו
CREATE POLICY "Main users can view their family permissions"
ON public.family_members_permissions
FOR SELECT
USING (main_user_id = auth.uid());

-- Policy חדש: INSERT - רק בן משפחה יכול ליצור בקשת הרשאה
CREATE POLICY "Family members can request permissions"
ON public.family_members_permissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_links fl
    WHERE fl.id = family_members_permissions.family_member_id
    AND fl.member_user_id = auth.uid()
  )
);

-- Policy חדש: UPDATE - רק משתמש ראשי יכול לעדכן (לאשר/לדחות)
CREATE POLICY "Main users can update family permissions"
ON public.family_members_permissions
FOR UPDATE
USING (main_user_id = auth.uid())
WITH CHECK (main_user_id = auth.uid());

-- Policy חדש: DELETE - רק משתמש ראשי יכול למחוק
CREATE POLICY "Main users can delete family permissions"
ON public.family_members_permissions
FOR DELETE
USING (main_user_id = auth.uid());