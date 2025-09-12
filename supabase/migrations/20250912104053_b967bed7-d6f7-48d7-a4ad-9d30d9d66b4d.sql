-- הוסף שדה מגדר לטבלת family_links
ALTER TABLE public.family_links 
ADD COLUMN gender text;

-- הוסף שדה מגדר לטבלת user_profiles אם לא קיים
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'gender' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN gender text;
    END IF;
END $$;