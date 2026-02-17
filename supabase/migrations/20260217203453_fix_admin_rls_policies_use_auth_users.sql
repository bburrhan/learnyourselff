/*
  # Fix All Admin RLS Policies - Use auth.users Lookup

  Replaces all admin RLS policies that use `auth.jwt() -> 'app_metadata'`
  with a more reliable pattern that queries `auth.users.raw_app_meta_data`
  directly. This fixes "new row violates row-level security policy" errors
  that occur because the JWT's app_metadata structure may not match the
  expected format.

  Also adds missing admin SELECT policies for courses and course_content
  so admins can see all records (not just active ones).

  1. Modified Tables
    - `courses` - Replaced 4 admin policies (INSERT, UPDATE, DELETE, SELECT for admins)
    - `course_content` - Replaced 4 admin policies (INSERT, UPDATE, DELETE, SELECT for admins)
    - `blog_posts` - Replaced 3 admin policies (INSERT, UPDATE, DELETE)
    - `categories` - Replaced 3 admin policies (INSERT, UPDATE, DELETE)
    - `purchases` - Replaced 1 admin policy (UPDATE)

  2. Security
    - All policies still require authenticated user
    - All policies still check admin role via raw_app_meta_data
    - Pattern matches the working storage.objects policies
*/

-- Helper: create a reusable function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_app_meta_data ->> 'role') = 'admin'
  );
$$;

-- ============================================================
-- COURSES TABLE
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

-- Recreate with auth.users lookup
CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Add admin SELECT policy so admins see ALL courses (not just active)
CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- COURSE_CONTENT TABLE
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert course content" ON course_content;
DROP POLICY IF EXISTS "Admins can update course content" ON course_content;
DROP POLICY IF EXISTS "Admins can delete course content" ON course_content;

CREATE POLICY "Admins can insert course content"
  ON course_content FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update course content"
  ON course_content FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete course content"
  ON course_content FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Add admin SELECT policy so admins see ALL content
CREATE POLICY "Admins can view all course content"
  ON course_content FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- BLOG_POSTS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;

CREATE POLICY "Admins can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PURCHASES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Admins can update purchases" ON purchases;

CREATE POLICY "Admins can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- STORAGE OBJECTS - also update to use the function for consistency
-- ============================================================

DROP POLICY IF EXISTS "Admins can upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course files" ON storage.objects;

CREATE POLICY "Admins can upload course covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-covers' AND public.is_admin());

CREATE POLICY "Admins can update course covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin());

CREATE POLICY "Admins can delete course covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-covers' AND public.is_admin());

CREATE POLICY "Admins can upload course files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-files' AND public.is_admin());

CREATE POLICY "Admins can update course files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-files' AND public.is_admin());

CREATE POLICY "Admins can delete course files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-files' AND public.is_admin());