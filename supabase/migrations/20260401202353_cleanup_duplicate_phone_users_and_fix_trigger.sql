/*
  # Cleanup duplicate phone users and fix handle_new_user trigger

  ## Problem
  The handle_new_user trigger was NOT saving phone_number from user_metadata to profiles.
  This caused verify-whatsapp-otp to never find existing users by phone, creating
  a new auth.users account on every OTP login attempt.

  Result: 5 duplicate auth.users accounts for +905467881919 with empty profiles.

  ## Changes
  1. Delete 4 duplicate auth.users rows for the same phone (keep oldest, all had 0 purchases)
  2. Fix handle_new_user trigger to also insert phone_number
  3. Backfill phone_number for all existing profiles from auth.users metadata
*/

-- 1. Delete duplicate profiles for the 4 newer duplicate users (keep oldest: 5cfa5590)
DELETE FROM public.profiles
WHERE id IN (
  'ebac06e2-c2c2-4abe-85f4-66b5282b73d5',
  'a6f575f4-fd40-4148-9f75-57092595ebab',
  '99999dea-562a-4470-b723-0440bfc4da3e',
  '8b799d95-d8e9-49f9-8ae5-e15ac01f5777'
);

-- 2. Delete the 4 duplicate auth.users (keep oldest: 5cfa5590-ea90-44ac-adf3-6aaf99aaf8b2)
DELETE FROM auth.users
WHERE id IN (
  'ebac06e2-c2c2-4abe-85f4-66b5282b73d5',
  'a6f575f4-fd40-4148-9f75-57092595ebab',
  '99999dea-562a-4470-b723-0440bfc4da3e',
  '8b799d95-d8e9-49f9-8ae5-e15ac01f5777'
);

-- 3. Fix handle_new_user trigger to include phone_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, language_preference, phone_number)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'language_preference', 'en'),
    new.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO UPDATE
    SET phone_number = COALESCE(
      EXCLUDED.phone_number,
      public.profiles.phone_number
    );
  RETURN new;
END;
$$;

-- 4. Backfill phone_number for all existing profiles from auth.users metadata
UPDATE public.profiles p
SET phone_number = u.raw_user_meta_data->>'phone_number'
FROM auth.users u
WHERE p.id = u.id
  AND p.phone_number IS NULL
  AND u.raw_user_meta_data->>'phone_number' IS NOT NULL;
