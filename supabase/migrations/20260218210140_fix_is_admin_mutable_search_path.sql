/*
  # Fix is_admin() mutable search_path security vulnerability

  1. Changes
    - Recreate the no-argument `is_admin()` function with `SET search_path TO ''`
    - This prevents search_path manipulation attacks on the SECURITY DEFINER function
    - Function signature and behavior remain identical

  2. Security
    - Pins search_path to empty string so all schema references must be fully qualified
    - The function already uses fully qualified `auth.users` and `auth.uid()`, so behavior is unchanged

  3. Cleanup
    - Drop the unused `is_admin(user_id uuid)` overload which accepts a parameter it never uses
*/

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_app_meta_data ->> 'role') = 'admin'
  );
$$;

DROP FUNCTION IF EXISTS public.is_admin(uuid);
