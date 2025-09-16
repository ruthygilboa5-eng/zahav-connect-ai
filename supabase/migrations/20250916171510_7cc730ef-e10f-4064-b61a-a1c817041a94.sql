-- Add family registration message template
INSERT INTO public.message_templates (feature, gender, subject, body)
VALUES 
  ('family_registration', 'neutral', 'ברוכים הבאים למערכת זהב', 
   'שלום [first_name],

הרשמתך התקבלה אצלנו במערכת זהב.

הבקשה שלך תישלח ל[main_user_name] לאישור.
תקבל הודעה כאשר הבקשה תאושר או תידחה.
לאחר אישור תוכל להתחיל להשתמש במערכת.

בברכה,
צוות זהב');