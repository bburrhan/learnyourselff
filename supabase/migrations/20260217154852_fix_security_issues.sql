/*
  # Fix Security Issues - Indexes, RLS Policies, and Function Search Paths

  1. Indexes
    - Add missing index on `user_progress.content_id` for FK `user_progress_content_id_fkey`

  2. RLS Policy Optimizations
    - Replace `auth.uid()` with `(select auth.uid())` in all affected RLS policies to
      prevent per-row re-evaluation and improve query performance at scale
    - Affected tables: purchases, profiles, course_content, user_progress,
      stripe_customers, stripe_subscriptions, stripe_orders

  3. Always-True Policy Fixes
    - Replace unrestricted `FOR ALL` management policies on blog_posts, categories,
      and courses with admin-only INSERT/UPDATE/DELETE policies
    - Replace unrestricted UPDATE policy on purchases with admin-only policy
    - This ensures only admins can modify data, while public read access remains unchanged

  4. Duplicate Policy Consolidation
    - Remove overlapping INSERT policies on purchases table
      ("Allow anonymous free course purchases" + "Allow public free purchases")
    - Replace with single anon-only free purchase policy

  5. Function Search Path Security
    - Set `search_path = ''` on all public functions to prevent search path injection:
      make_user_admin, is_admin, handle_new_user, update_updated_at_column,
      remove_admin_role, get_admin_count
*/

-- =================================================================
-- 1. Add missing index for user_progress.content_id FK
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_content_id
  ON public.user_progress(content_id);

-- =================================================================
-- 2. Fix RLS policies: purchases table
-- =================================================================

-- Fix SELECT policy: auth.uid() -> (select auth.uid())
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix INSERT policy: auth.uid() -> (select auth.uid())
DROP POLICY IF EXISTS "Allow authenticated user purchases" ON public.purchases;
CREATE POLICY "Allow authenticated user purchases"
  ON public.purchases FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (select auth.uid())) OR (amount = (0)::numeric));

-- Fix always-true UPDATE policy: restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can update purchases" ON public.purchases;
CREATE POLICY "Admins can update purchases"
  ON public.purchases FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

-- Consolidate duplicate anon INSERT policies
DROP POLICY IF EXISTS "Allow anonymous free course purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow public free purchases" ON public.purchases;
CREATE POLICY "Allow anonymous free purchases"
  ON public.purchases FOR INSERT
  TO anon
  WITH CHECK (amount = (0)::numeric);

-- =================================================================
-- 3. Fix RLS policies: profiles table
-- =================================================================

-- Replace FOR ALL with specific policies using (select auth.uid())
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =================================================================
-- 4. Fix RLS policies: course_content table
-- =================================================================

DROP POLICY IF EXISTS "Admins can insert course content" ON public.course_content;
CREATE POLICY "Admins can insert course content"
  ON public.course_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update course content" ON public.course_content;
CREATE POLICY "Admins can update course content"
  ON public.course_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete course content" ON public.course_content;
CREATE POLICY "Admins can delete course content"
  ON public.course_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = (select auth.uid())
      AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- =================================================================
-- 5. Fix RLS policies: user_progress table
-- =================================================================

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;
CREATE POLICY "Users can delete own progress"
  ON public.user_progress FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =================================================================
-- 6. Fix always-true management policies: blog_posts
-- =================================================================

DROP POLICY IF EXISTS "Authenticated users can manage blog posts" ON public.blog_posts;

CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

-- =================================================================
-- 7. Fix always-true management policies: categories
-- =================================================================

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

-- =================================================================
-- 8. Fix always-true management policies: courses
-- =================================================================

DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'user_metadata' ->> 'role') = 'admin');

-- =================================================================
-- 9. Fix RLS policies: stripe tables (conditional)
-- =================================================================

DROP POLICY IF EXISTS "Users can view their own customer data" ON public.stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING ((user_id = (select auth.uid())) AND (deleted_at IS NULL));

DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON public.stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    (customer_id IN (
      SELECT stripe_customers.customer_id
      FROM public.stripe_customers
      WHERE stripe_customers.user_id = (select auth.uid())
      AND stripe_customers.deleted_at IS NULL
    ))
    AND (deleted_at IS NULL)
  );

DROP POLICY IF EXISTS "Users can view their own order data" ON public.stripe_orders;
CREATE POLICY "Users can view their own order data"
  ON public.stripe_orders FOR SELECT
  TO authenticated
  USING (
    (customer_id IN (
      SELECT stripe_customers.customer_id
      FROM public.stripe_customers
      WHERE stripe_customers.user_id = (select auth.uid())
      AND stripe_customers.deleted_at IS NULL
    ))
    AND (deleted_at IS NULL)
  );

-- =================================================================
-- 10. Fix function search paths
-- =================================================================

ALTER FUNCTION public.make_user_admin(user_email text) SET search_path = '';
ALTER FUNCTION public.is_admin(user_id uuid) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.remove_admin_role(user_email text) SET search_path = '';
ALTER FUNCTION public.get_admin_count() SET search_path = '';
