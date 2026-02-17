/*
  # Fix Storage Admin RLS Policies

  All 6 admin storage policies on `storage.objects` incorrectly check
  `raw_user_meta_data` for the admin role. The admin role is actually stored
  in `raw_app_meta_data` (which maps to JWT `app_metadata`).

  This migration drops and recreates all 6 policies to check the correct
  metadata field, matching how all other table-level admin policies work.

  1. Affected Policies (storage.objects)
    - "Admins can upload course files" (INSERT) - fixed
    - "Admins can update course files" (UPDATE) - fixed
    - "Admins can delete course files" (DELETE) - fixed
    - "Admins can upload course covers" (INSERT) - fixed
    - "Admins can update course covers" (UPDATE) - fixed
    - "Admins can delete course covers" (DELETE) - fixed

  2. Change
    - `raw_user_meta_data ->> 'role'` changed to `raw_app_meta_data ->> 'role'`
    - Uses optimized `(select auth.uid())` pattern
*/

-- =================================================================
-- Fix course-files bucket policies
-- =================================================================

DROP POLICY IF EXISTS "Admins can upload course files" ON storage.objects;
CREATE POLICY "Admins can upload course files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update course files" ON storage.objects;
CREATE POLICY "Admins can update course files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete course files" ON storage.objects;
CREATE POLICY "Admins can delete course files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );

-- =================================================================
-- Fix course-covers bucket policies
-- =================================================================

DROP POLICY IF EXISTS "Admins can upload course covers" ON storage.objects;
CREATE POLICY "Admins can upload course covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update course covers" ON storage.objects;
CREATE POLICY "Admins can update course covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete course covers" ON storage.objects;
CREATE POLICY "Admins can delete course covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_app_meta_data ->> 'role') = 'admin'
    )
  );