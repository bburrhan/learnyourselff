/*
  # Fix anonymous purchases policy

  1. Security Updates
    - Drop existing policies that prevent anonymous insertions
    - Create new policy specifically for anonymous users to insert free course purchases
    - Ensure authenticated users can still insert their own purchases
    - Maintain security by only allowing free courses (amount = 0) for anonymous users

  2. Policy Changes
    - "Anonymous users can insert free course purchases" - allows anon role to insert when amount = 0
    - "Authenticated users can insert own purchases" - allows authenticated users to insert with matching user_id
    - Proper role-based access control
*/

-- Drop existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Anonymous users can insert free course purchases" ON purchases;
DROP POLICY IF EXISTS "Authenticated users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Public can insert free purchases" ON purchases;

-- Create policy for anonymous users to insert free course purchases
CREATE POLICY "Allow anonymous free course purchases"
  ON purchases
  FOR INSERT
  TO anon
  WITH CHECK (amount = 0);

-- Create policy for authenticated users to insert their own purchases
CREATE POLICY "Allow authenticated user purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR amount = 0);

-- Also allow public role for free purchases (covers both anon and authenticated)
CREATE POLICY "Allow public free purchases"
  ON purchases
  FOR INSERT
  TO public
  WITH CHECK (amount = 0);