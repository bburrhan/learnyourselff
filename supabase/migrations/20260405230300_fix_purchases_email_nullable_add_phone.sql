/*
  # Fix purchases table for phone-only enrollments

  ## Summary
  Phone-only users (WhatsApp OTP) were failing to enroll in free courses because:
  1. The `email` column was NOT NULL, but phone-only users don't have an email
  2. The `phone_number` column didn't exist on the `purchases` table

  ## Changes
  - `purchases.email`: Changed from NOT NULL to nullable
  - `purchases.phone_number`: New optional column to store the enrollee's phone number

  ## Security
  - No RLS changes needed; existing policies remain intact
*/

ALTER TABLE purchases ALTER COLUMN email DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE purchases ADD COLUMN phone_number text;
  END IF;
END $$;
