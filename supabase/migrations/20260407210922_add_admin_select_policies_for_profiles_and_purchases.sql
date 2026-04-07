/*
  # Add Admin SELECT Policies for Profiles and Purchases

  ## Problem
  The `profiles` and `purchases` tables have RLS enabled but lack SELECT policies
  for admin users. This means admin queries to fetch all users and all sales data
  are silently returning empty arrays, even though data exists in the tables.

  ## Changes

  ### profiles table
  - Add SELECT policy: "Admins can view all profiles"
    Allows users where `is_admin()` returns true to read all profile rows.

  ### purchases table
  - Add SELECT policy: "Admins can view all purchases"
    Allows users where `is_admin()` returns true to read all purchase rows.

  ## Security
  Both policies use the existing `is_admin()` function which checks admin status
  from the auth context. This ensures only verified admins gain this access.
*/

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (is_admin());
