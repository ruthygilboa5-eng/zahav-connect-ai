-- Remove any existing unique constraint on phone (if it exists)
-- and make phone unique only per user, not globally
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_phone_key;

-- Add a unique constraint that allows same phone for different users
-- but prevents duplicate phones for the same user
ALTER TABLE contacts ADD CONSTRAINT contacts_owner_phone_unique 
UNIQUE (owner_user_id, phone);