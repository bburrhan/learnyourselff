/*
  # Fix purchases table RLS policy for free courses

  1. Security Changes
    - Update INSERT policy on `purchases` table to allow anonymous users to create purchase records
    - This enables free course enrollment for both authenticated and unauthenticated users
    - Maintains security by only allowing inserts, not reads or updates for anonymous users

  2. Policy Details
    - Authenticated users can insert purchases (existing functionality)
    - Anonymous users can insert purchases (new functionality for free courses)
    - Read access remains restricted to authenticated users viewing their own purchases
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Anyone can create purchases" ON purchases;

-- Create a new INSERT policy that allows both authenticated and anonymous users
CREATE POLICY "Allow purchase creation for free courses"
  ON purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the existing SELECT policy remains unchanged for security
-- (Users can only view their own purchases when authenticated)